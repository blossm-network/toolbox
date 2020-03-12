const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
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
        `${config.service}-${config.procedure}-${config.name}-${config.domain}-did-${config.event.action}-${config.event.domain}`,
        MAX_LENGTH
      ),
      operationHash: hash(
        config.name,
        config.domain,
        config.service,
        config.event.action,
        config.event.domain,
        config.event.service,
        config.procedure
      )
    };
  }
});
