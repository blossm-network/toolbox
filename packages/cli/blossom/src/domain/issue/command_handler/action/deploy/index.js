const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
  configFn: config => {
    return {
      _ACTION: config.action,
      _OPERATION_HASH: hash(
        config.action + config.domain + config.context + config.service
      ).toString(),
      _EVENT_STORE_HASH: hash(
        `${config.domain}event-store${config.service}`
      ).toString()
    };
  }
});
