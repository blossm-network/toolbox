const deployCliTemplate = require("@blossm/deploy-cli-template");

module.exports = deployCliTemplate({
  domain: "command-gateway",
  dir: __dirname,
  configFn: () => {
    return {};
  }
});
