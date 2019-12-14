const normalize = require("@blossm/normalize-cli");
const rootDir = require("@blossm/cli-root-dir");

module.exports = async args => {
  const input = await normalize({
    entrypointType: "default",
    args,
    choices: ["mongodb"]
  });

  rootDir.saveConfig({
    defaults: {
      viewStore: input.default
    }
  });
};
