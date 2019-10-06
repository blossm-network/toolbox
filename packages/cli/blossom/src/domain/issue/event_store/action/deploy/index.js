const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");

module.exports = deployCliTemplate({
  domain: "event-store",
  dir: __dirname,
  configFn: config => {
    return {
      _OPERATION_HASH: hash(
        config.domain + config.context + config.service
      ).toString()
    };
  }
});
