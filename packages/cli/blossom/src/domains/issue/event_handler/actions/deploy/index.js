const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");
const trim = require("@sustainers/trim-string");
const { MAX_LENGTH } = require("@sustainers/service-name-consts");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
  configFn: config => {
    //eslint-disable-next-line no-console
    console.log("target: ", {
      name: config.target.name,
      domain: config.target.domain,
      context: config.target.context,
      service: config.service,
      hash: hash(
        config.target.name +
          config.target.domain +
          config.target.context +
          config.service
      ).toString()
    });
    return {
      _ACTION: config.action,
      _OPERATION_NAME: trim(
        `${config.service}-${config.context}-${config.target.context}-${config.target.domain}-${config.target.name}-${config.domain}-did-${config.action}`,
        MAX_LENGTH
      ),
      _OPERATION_HASH: hash(
        config.action +
          config.domain +
          config.context +
          config.target.name +
          config.target.domain +
          config.target.context +
          config.service
      ).toString(),
      _TARGET_HASH: hash(
        config.target.name +
          config.target.domain +
          config.target.context +
          config.service
      ).toString(),
      _TARGET_NAME: config.target.name,
      _TARGET_DOMAIN: config.target.domain,
      _TARGET_CONTEXT: config.target.context
    };
  }
});
