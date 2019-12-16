const normalize = require("@blossm/normalize-cli");
const rootDir = require("@blossm/cli-root-dir");

module.exports = async args => {
  const input = await normalize({
    entrypointType: "default",
    args,
    choices: ["gcp"]
  });

  rootDir.saveConfig({
    defaults: {
      cloud: input.default
    }
  });
};
