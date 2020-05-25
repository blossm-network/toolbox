const deployCliTemplate = require("@blossm/deploy-cli-template");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
});
