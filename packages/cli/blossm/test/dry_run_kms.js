import assert from "assert";
import path from "path";
import fs from "fs";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
  it("creates event-store KMS resources only for a strict deployment", async () => {
    const source = fs.readFileSync(
      new URL(
        `../../utils/merge_cli_template/src/write_build/event_store.js`,
        import.meta.url
      ),
      "utf8"
    );
    const names = [...source.matchAll(/^import (\w+) from/gm)].map(
      (match) => match[1]
    );
    const generator = await load(
      `${buildDir}/event_store.js`,
      Object.fromEntries(
        names.map((name) => [
          name,
          name === "yarnInstall" ? {} : () => ({ resource: name }),
        ])
      )
    );
    const resources = [
      "createKeyRing",
      "createSymmetricEncryptKey",
      "createAsymmetricSignKey",
    ];
    for (const strict of [false, true]) {
      const steps = generator({ strict, actions: [] });
      for (const resource of resources) {
        assert.strictEqual(
          steps.filter((step) => step.resource === resource).length,
          strict ? 1 : 0,
          resource
        );
      }
    }
  });


});
