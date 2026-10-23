import assert from "assert";
import path from "path";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
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
