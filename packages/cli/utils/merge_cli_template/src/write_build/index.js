const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");

const substitutions = require("./substitutions");
const steps = require("./steps");

module.exports = ({ config, workingDir, configFn, env }) => {
  const buildPath = path.resolve(workingDir, "build.yaml");

  const build = {
    substitutions: substitutions({ config, configFn, env }),
    steps: steps({ config, env })
  };

  fs.writeFileSync(buildPath, yaml.stringify(build));
};
