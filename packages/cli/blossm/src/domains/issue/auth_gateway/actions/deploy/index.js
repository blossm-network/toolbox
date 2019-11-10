const deployCliTemplate = require("@blossm/deploy-cli-template");

module.exports = deployCliTemplate({
  domain: "auth-gateway",
  dir: __dirname,
  configFn: () => {
    return {};
  }
});
