const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");

module.exports = deployCliTemplate({
  domain: "view-store",
  configFn: config => {
    return {
      _ID: config.id,
      _OPERATION_HASH: hash(
        config.id + config.domain + config.context + config.service
      ).toString()
    };
  }
});
