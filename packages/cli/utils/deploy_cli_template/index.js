const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const mergeCliTemplate = require("@blossm/merge-cli-template");
const testCliTemplate = require("@blossm/test-cli-template");
const fs = require("fs-extra");
const { spawnSync } = require("child_process");
const rootDir = require("@blossm/cli-root-dir");
const path = require("path");
const { green } = require("chalk");

const build = async workingDir => {
  const blossmConfig = rootDir.config();

  spawnSync(
    "gcloud",
    [
      "builds",
      "submit",
      ".",
      "--config=build.yaml",
      `--project=${blossmConfig.vendors.cloud.gcp.project}`
    ],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir
    }
  );
};

module.exports = ({ domain, dir, configFn }) => async args => {
  //eslint-disable-next-line no-console
  console.log(roboSay("Running your tests..."));

  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: ".",
    args,
    flags: [
      {
        name: "test-only",
        short: "t",
        type: Boolean,
        default: false
      },
      {
        name: "env",
        type: String,
        short: "e",
        default: "staging"
      },
      {
        name: "allow-fail",
        type: Boolean,
        short: "a",
        default: false
      }
    ]
  });

  const workingDir = path.resolve(dir, "tmp");

  fs.removeSync(workingDir);
  fs.mkdirSync(workingDir);
  await mergeCliTemplate({
    scriptDir: dir,
    workingDir,
    input,
    configFn
  });

  if (input.testOnly) {
    await testCliTemplate({ workingDir, input });
  } else {
    //eslint-disable-next-line no-console
    console.log(
      roboSay(
        `Deploying your ${domain
          .split("-")
          .join(" ")}... It might take 5 minutes or so, maybe 4 on a good day.`
      )
    );
    await build(workingDir);
  }

  fs.removeSync(workingDir);

  //eslint-disable-next-line no-console
  console.log(roboSay("Woohoo!"), green.bold("done"));
};
