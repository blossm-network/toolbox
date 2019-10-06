const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
  configFn: config => {
    return {
      _ACTION: config.action,
      _OPERATION_HASH: hash(
        config.action +
          config.domain +
          config.context +
          config.target.id +
          config.target.domain +
          config.target.context +
          config.service
      ).toString(),
      _TARGET_HASH: hash(
        config.target.id +
          config.target.domain +
          config.target.context +
          config.service
      ).toString(),
      _TARGET_ID: config.target.id,
      _TARGET_DOMAIN: config.target.domain,
      _TARGET_CONTEXT: config.target.context
    };
  }
});
