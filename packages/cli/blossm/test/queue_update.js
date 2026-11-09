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


});
