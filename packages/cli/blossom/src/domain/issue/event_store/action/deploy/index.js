const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");
const trim = require("@sustainers/trim-string");
const { MAX_LENGTH } = require("@sustainers/service-name-consts");

module.exports = deployCliTemplate({
  domain: "event-store",
  dir: __dirname,
  configFn: config => {
    return {
      _OPERATION_NAME: trim(
        `${config.service}-${config.context}-${config.domain}`,
        MAX_LENGTH
      ),
      _OPERATION_HASH: hash(
        config.domain + config.context + config.service
      ).toString()
    };
  }
});
