const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");
const path = require("path");

module.exports = deployCliTemplate({
  domain: "event-store",
  workingDir: path.resolve(__dirname, "tmp"),
  configFn: config => {
    return {
      _OPERATION_HASH: hash(
        config.domain + config.context + config.service
      ).toString()
    };
  }
});
