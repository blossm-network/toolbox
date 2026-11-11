import assert from "assert";
import fs from "fs";
import { load } from "./load.js";
import deployRun from "../../utils/merge_cli_template/src/write_build/steps/deploy_run.js";
import mainService from "../../utils/merge_cli_template/src/write_compose/main_service.js";

const buildDir = "utils/merge_cli_template/src/write_build";

// Every build generator that accepts both envVars and devEnvVars follows this rule.
describe("Deployment and local environment boundaries", () => {
  for (const procedure of [
    "job",
    "fact",
    "command",
    "command_gateway",
    "projection",
  ]) {
    it(`keeps ${procedure} development overrides local in every environment`, async () => {
      const source = fs.readFileSync(
        new URL(`../../${buildDir}/${procedure}.js`, import.meta.url),
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
      for (const env of ["production", "sandbox", "staging", "development"]) {
        const envVars = { ENDPOINT: `${env}-endpoint`, LIVE: "yes" };
        const devEnvVars = { ENDPOINT: "local-endpoint", TEST_ONLY: "yes" };
        for (const strict of [false, true]) {
          const steps = generator({
            strict,
            env,
            envVars,
            devEnvVars,
            actions: [],
            events: [],
          });
          const deployment = steps.find((step) => step.step === "deployRun");
          assert.strictEqual(Boolean(deployment), strict);
          if (strict) {
            const deployed = deployment.options.env;
            assert.strictEqual(deployed.ENDPOINT, envVars.ENDPOINT);
            assert.strictEqual(deployed.LIVE, "yes");
            assert(!Object.hasOwn(deployed, "TEST_ONLY"));
            const [prepare, deploy] = deployRun(deployment.options);
            assert(deploy.args.includes("--env-vars-file=.blossm-cloud-run-env.json"));
            const variables = JSON.parse(Buffer.from(prepare.args.at(-1), "base64").toString());
            assert.strictEqual(variables.ENDPOINT, envVars.ENDPOINT);
            assert(!Object.hasOwn(variables, "TEST_ONLY"));
          }
          const local = steps.find((step) => step.step === "writeEnv").options
            .custom;
          assert.strictEqual(local.ENDPOINT, "local-endpoint");
          assert.strictEqual(local.TEST_ONLY, "yes");
          assert.strictEqual(local.LIVE, "yes");
          const compose = mainService({
            procedure: procedure.replace("_", "-"),
            envVars,
            devEnvVars,
          });
          assert.strictEqual(compose.environment.NODE_ENV, "local");
          assert.strictEqual(compose.environment.ENDPOINT, "local-endpoint");
          assert.strictEqual(compose.environment.TEST_ONLY, "yes");
          assert.strictEqual(compose.environment.LIVE, "yes");
        }
      }
    });
  }
});
