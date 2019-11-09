const deployCliTemplate = require("@sustainers/deploy-cli-template");

module.exports = deployCliTemplate({
  domain: "auth-gateway",
  dir: __dirname,
  configFn: () => {
    return {};
  }
});
