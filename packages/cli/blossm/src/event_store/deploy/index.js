const deployCliTemplate = require("@blossm/deploy-cli-template");

module.exports = deployCliTemplate({
  domain: "event-store",
  dir: __dirname,
});
