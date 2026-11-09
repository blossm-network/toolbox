import assert from "assert";
import path from "path";
import fs from "fs";
import { load } from "./load.js";

const buildDir = "utils/merge_cli_template/src/write_build";

describe("Generated build steps", () => {
  it("keeps job and fact development overrides out of the deployed environment", async () => {
    for (const procedure of ["job", "fact"]) {
      const source = fs.readFileSync(
        new URL(
          `../../utils/merge_cli_template/src/write_build/${procedure}.js`,
          import.meta.url
        ),
        "utf8"
      );
      const names = [...source.matchAll(/^import (\w+) from/gm)].map(
        (match) => match[1]
      );
      const generator = await load(
        `${buildDir}/${procedure}.js`,
        Object.fromEntries(
          names.map((name) => [
            name,
            name === "yarnInstall"
              ? {}
              : (options) => ({ step: name, options }),
          ])
        )
      );
      const steps = generator({
        strict: true,
        env: "production",
        envVars: { ENDPOINT: "production", LIVE: "yes" },
        devEnvVars: { ENDPOINT: "development", TEST_ONLY: "yes" },
      });
      const deployed = steps.find((step) => step.step === "deployRun").options
        .env;
      assert.strictEqual(deployed.ENDPOINT, "production", procedure);
      assert.strictEqual(deployed.LIVE, "yes", procedure);
      assert(!Object.hasOwn(deployed, "TEST_ONLY"), procedure);
      const local = steps.find((step) => step.step === "writeEnv").options
        .custom;
      assert.strictEqual(local.ENDPOINT, "development", procedure);
      assert.strictEqual(local.TEST_ONLY, "yes", procedure);
    }
  });


});
