const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/hash-string");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
  configFn: config => {
    return {
      _ACTION: config.action,
      _NAME: config.name,
      _OPERATION_NAME: trim(
        `${config.service}-${config.context}-did-${config.action}-${config.name}`,
        MAX_LENGTH
      ),
      _OPERATION_HASH: hash(
        config.name +
          config.action +
          config.domain +
          config.context +
          config.service
      ).toString()
    };
  }
});
