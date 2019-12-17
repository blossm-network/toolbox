const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/service-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "view-store",
  dir: __dirname,
  configFn: config => {
    return {
      _NAME: config.name,
      _OPERATION_NAME: trim(
        `${config.service}-${config.context}-${config.domain}-${config.name}`,
        MAX_LENGTH
      ),
      _OPERATION_HASH: hash({
        procedure: [config.name, config.domain, config.context],
        service: config.service
      })
    };
  }
});
