import assert from "assert";
import path from "path";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
  it("writes environment data without shell or build-variable interpolation", async () => {
    const writeEnv = await load(`${buildDir}/steps/write_env.js`, {
      nodeImage: "node:fixture",
    });
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

  it("omits unset values and keeps deliberate falsy ones", async () => {
    const writeEnv = await load(`${buildDir}/steps/write_env.js`, {
      nodeImage: "node:fixture",
    });
    const step = writeEnv({
      project: "project",
      custom: { EMPTY: "", ZERO: 0, FALSE: false, UNSET: undefined },
    });
    const lines = Buffer.from(step.args[2], "base64").toString().split("\n");
    for (const line of ["GCP_PROJECT=project", "EMPTY=", "ZERO=0", "FALSE=false"])
      assert(lines.includes(line), line);
    assert(!lines.some((line) => /^(UNSET|GCP_SECRET_BUCKET)=|=undefined$/.test(line)));
  });


});
