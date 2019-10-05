const fs = require("fs-extra");
const { spawnSync } = require("child_process");
const yaml = require("yaml");
const path = require("path");

module.exports = async workingDir => {
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
