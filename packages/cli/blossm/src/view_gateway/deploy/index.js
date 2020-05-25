const deployCliTemplate = require("@blossm/deploy-cli-template");

module.exports = deployCliTemplate({
  domain: "view-gateway",
  dir: __dirname,
});
