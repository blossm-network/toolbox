const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/service-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "command-handler",
  dir: __dirname,
  configFn: config => {
    return {
      action: config.action,
      operationHash: hash({
        procedure: [config.action, config.domain, config.context],
        service: config.service
      }),
      operationName: trim(
        `${config.service}-${config.context}-${config.domain}-${config.action}`,
        MAX_LENGTH
      )
    };
  }
});
