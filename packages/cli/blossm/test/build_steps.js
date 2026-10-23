import assert from "assert";
import path from "path";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
  it("updates queues in the selected project with exactly the configured limit", async () => {
    const updateQueue = await load(`${buildDir}/steps/update_queue.js`);
    for (const limit of [1, 100]) {
      const step = updateQueue({
        name: "queue",
        project: "target-project",
        maxDispatchPerSecond: limit,
        maxConcurrentDispatches: limit,
      });
      assert.strictEqual(step.entrypoint, "gcloud");
      assert.deepStrictEqual(step.args.slice(0, 4), [
        "tasks",
        "queues",
        "update",
        "queue",
      ]);
      assert.deepStrictEqual(
        step.args.filter((arg) =>
          arg.startsWith("--max-concurrent-dispatches=")
        ),
        [`--max-concurrent-dispatches=${limit}`]
      );
      assert(step.args.includes("--project=target-project"));
      assert(!step.args.some((arg) => arg.includes("exit 0")));
    }
  });

  it("forwards the deployment project to every queue update", async () => {
    for (const procedure of [
      "command",
      "event_store",
      "job",
      "projection",
      "view_store",
    ]) {
      const source = await import("fs").then(({ default: fs }) =>
        fs.readFileSync(
          new URL(
            `../../utils/merge_cli_template/src/write_build/${procedure}.js`,
            import.meta.url
          ),
          "utf8"
        )
      );
      const names = [...source.matchAll(/^import (\w+) from/gm)].map(
        (match) => match[1]
      );
      const queueOptions = [];
      const generator = await load(
        `${buildDir}/${procedure}.js`,
        Object.fromEntries(
          names.map((name) => [
            name,
            name === "yarnInstall"
              ? {}
              : (options) => {
                  if (name === "updateQueue") queueOptions.push(options);
                  return {};
                },
          ])
        )
      );
      generator({
        strict: true,
        project: "target-project",
        actions: [],
        events: [],
      });
      assert(queueOptions.length, procedure);
      for (const options of queueOptions)
        assert.strictEqual(options.project, "target-project", procedure);
    }
  });

  it("writes environment data without shell or build-variable interpolation", async () => {
    const writeEnv = await load(`${buildDir}/steps/write_env.js`);
    const literal =
      '$VAR $(touch marker) `touch marker` "quotes"\nEOM\nOTHER=value';
    const step = writeEnv({ custom: { LITERAL: literal } });
    assert.strictEqual(step.entrypoint, "node");
    assert.strictEqual(step.args[0], "-e");
    assert(!step.args[2].includes("$"));
    let filename;
    let bytes;
    const run = new Function("require", "process", "Buffer", step.args[1]);
    run(
      (name) => {
        assert.strictEqual(name, "fs");
        return {
          writeFileSync: (file, data) => {
            filename = file;
            bytes = data;
          },
        };
      },
      { argv: ["node", step.args[2]] },
      Buffer
    );
    assert.strictEqual(filename, ".env");
    assert(bytes.toString().endsWith(`LITERAL=${literal}\n`));
  });

  it("passes one complete scheduler host to every procedure", async () => {
    const procedures = {
      "view-store": "viewStore",
      "view-composite": "viewComposite",
      "event-store": "eventStore",
      projection: "projection",
      command: "command",
      job: "job",
      fact: "fact",
    };
    let build;
    const writeBuild = await load(`${buildDir}/index.js`, {
      path,
      fs: {
        existsSync: () => false,
        writeFileSync: (file, value) => {
          build = value;
        },
      },
      yaml: { stringify: (value) => value },
      ...Object.fromEntries(
        Object.values(procedures).map((name) => [name, (options) => [options]])
      ),
    });
    for (const procedure of Object.keys(procedures)) {
      writeBuild({
        workingDir: "/fixture",
        procedure,
        region: "us-central1",
        operationName: "operation",
        operationHash: "hash",
        computeUrlId: "project",
      });
      assert.strictEqual(
        build.steps[0].uri,
        "us-central1-operation-hash-project.us-central1.run.app"
      );
      assert(!/\s/.test(build.steps[0].uri));
    }
  });
});
