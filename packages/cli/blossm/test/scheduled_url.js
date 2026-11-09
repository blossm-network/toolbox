import assert from "assert";
import path from "path";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
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
