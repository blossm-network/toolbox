const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");
const path = require("path");

module.exports = deployCliTemplate({
  domain: "view-store",
  workingDir: path.resolve(__dirname, "tmp"),
  configFn: config => {
    return {
      _ID: config.id,
      _OPERATION_HASH: hash(
        config.id + config.domain + config.context + config.service
      ).toString()
    };
  }
});
