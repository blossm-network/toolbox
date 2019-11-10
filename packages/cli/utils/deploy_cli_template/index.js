const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const mergeCliTemplate = require("@blossm/merge-cli-template");
const testCliTemplate = require("@blossm/test-cli-template");
const fs = require("fs-extra");
const { spawnSync } = require("child_process");
const yaml = require("yaml");
const path = require("path");
const { green } = require("chalk");

const build = async workingDir => {
  const buildPath = path.resolve(workingDir, "build.yaml");
  const { substitutions } = yaml.parse(fs.readFileSync(buildPath, "utf8"));

  spawnSync(
    "gcloud",
    [
      "builds",
      "submit",
      ".",
      "--config=build.yaml",
      `--project=${substitutions._GCP_PROJECT}`
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
      }
    ]
  });

  const workingDir = path.resolve(dir, "tmp");

  fs.removeSync(workingDir);
  fs.mkdirSync(workingDir);
  await mergeCliTemplate({
    templateDir: dir,
    workingDir,
    input,
    configFn
  });

  await testCliTemplate({ workingDir, input });

  if (!input.testOnly) {
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
