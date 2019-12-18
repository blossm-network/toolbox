const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/service-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
  configFn: config => {
    return {
      action: config.action,
      name: config.name,
      operationName: trim(
        `${config.service}-${config.context}-did-${config.action}-${config.name}`,
        MAX_LENGTH
      ),
      operationHash: hash({
        procedure: [config.name, config.action, config.domain, config.context],
        service: config.service
      })
    };
  }
});
