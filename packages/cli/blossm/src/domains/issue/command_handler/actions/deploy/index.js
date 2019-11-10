const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/hash-string");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "command-handler",
  dir: __dirname,
  configFn: config => {
    return {
      _ACTION: config.action,
      _OPERATION_HASH: hash(
        config.action + config.domain + config.context + config.service
      ).toString(),
      _OPERATION_NAME: trim(
        `${config.service}-${config.context}-${config.domain}-${config.action}`,
        MAX_LENGTH
      )
    };
  }
});
