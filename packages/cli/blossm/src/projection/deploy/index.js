const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "projection",
  dir: __dirname,
  configFn: config => {
    return {
      action: config.action,
      name: config.name,
      operationName: trim(
        `${config.procedure}-${config.service}-${config.name}-${config.domain}-did-${config.event.action}-${config.event.domain}`,
        MAX_LENGTH
      ),
      operationHash: hash({
        procedure: [
          config.name,
          config.domain,
          config.service,
          config.event.action,
          config.event.domain,
          config.event.service,
          config.procedure
        ],
        service: config.service
      })
    };
  }
});
