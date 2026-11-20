import normalize from "@blossm/normalize-cli";
import roboSay from "@blossm/robo-say";
import mergeCliTemplate from "@blossm/merge-cli-template";
import testCliTemplate from "@blossm/test-cli-template";
import fs from "fs-extra";
import deps from "./deps.js";
import ensureRuntimeIdentity from "./ensure_runtime_identity.js";
import rootDir from "@blossm/cli-root-dir";
import path from "path";
import chalk from "chalk";
import os from "os";

const { green, red } = chalk;

const envProject = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.projects.production;
    case "sandbox":
      return config.vendors.cloud.gcp.projects.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.projects.staging;
    case "development":
      return config.vendors.cloud.gcp.projects.development;
    default:
      return "";
  }
};

const build = async ({ workingDir, env }) => {
  const blossmConfig = rootDir.config();
  const project = envProject({ config: blossmConfig, env });

  const created = ensureRuntimeIdentity({
    workingDir,
    project,
    execFileSync: deps.execFileSync,
  });
  if (created) console.log(roboSay(`Created the runtime identity ${created}.`));

  deps.execFileSync(
    "gcloud",
    [
      "beta",
      "builds",
      "submit",
      ".",
      "--config=build.yaml",
      `--project=${project}`,
    ],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir,
    },
  );
};

export default ({ domain, dir }) =>
  async (args, configFn) => {
    const blossmConfig = rootDir.config();
    const input = await normalize({
      entrypointType: "path",
      entrypointDefault: ".",
      args,
      flags: [
        {
          name: "unit-test",
          short: "t",
          type: Boolean,
          default: false,
        },
        {
          name: "env",
          type: String,
          short: "e",
          choices: ["production", "sandbox", "staging", "development", "all"],
          default: blossmConfig.defaultEnv || "development",
        },
        {
          name: "dry-run",
          type: Boolean,
          short: "d",
          default: false,
        },
      ],
    });

    await Promise.all(
      (input.env == "all"
        ? ["development", "staging", "sandbox", "production"]
        : [input.env]
      ).map(async (e) => {
        const workingDir = fs.mkdtempSync(path.join(os.tmpdir(), "blossm-"));

        console.log(
          roboSay(
            `Deploying ${e} by assembling template into ${workingDir}...`,
          ),
        );

        try {
          // Assembly failures also remove the working directory.
          await mergeCliTemplate({
            scriptDir: dir,
            workingDir,
            env: e,
            path: input.path,
            dry: input.dryRun,
            configFn,
          });

          if (input.unitTest) {
            console.log(roboSay("Running your tests..."));
            await testCliTemplate({ workingDir, input });
            fs.removeSync(workingDir);

            console.log(roboSay(), green.bold("done"));
          } else {
            console.log(
              roboSay(
                `Deploying your ${domain
                  .split("-")
                  .join(
                    " ",
                  )}... It might take 5 minutes or so, maybe 4 on a good day.`,
              ),
            );

            await build({ workingDir, env: e });
            fs.removeSync(workingDir);

            console.log(roboSay(), green.bold("done"));
          }
        } catch (e) {
          fs.removeSync(workingDir);

          console.log(roboSay("Something went wrong"), red.bold("error"));
          throw e;
        }
      }),
    );
  };
