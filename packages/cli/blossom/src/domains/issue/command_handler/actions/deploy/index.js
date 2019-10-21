const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");
const trim = require("@sustainers/trim-string");
const { MAX_LENGTH } = require("@sustainers/service-name-consts");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
  configFn: config => {
    return {
      _AUTHENTICATION: config["allow-unauthenticated"]
        ? "--allow-unauthenticated"
        : "--no-allow-unauthenticated",
      _ACTION: config.action,
      _OPERATION_HASH: hash(
        config.action + config.domain + config.context + config.service
      ).toString(),
      _OPERATION_NAME: trim(
        `${config.service}-${config.context}-${config.domain}-${config.action}`,
        MAX_LENGTH
      ),
      _EVENT_STORE_HASH: hash(
        `${config.domain}event-store${config.service}`
      ).toString()
    };
  }
});
