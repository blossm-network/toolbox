const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "event-handler",
  dir: __dirname,
  configFn: (config) => {
    return {
      name: config.name,
      operationName: trim(
        `${config.procedure}-${config.context}-${config.name}${
          config.service ? `-${config.service}` : ""
        }${config.domain ? `-${config.domain}` : ""}-did-${
          config.event.action
        }-${config.event.domain}`,
        MAX_LENGTH
      ),
      operationHash: hash(
        config.name,
        ...(config.domain ? [config.domain] : []),
        ...(config.service ? [config.service] : []),
        config.context,
        config.event.action,
        config.event.context,
        config.event.service,
        config.procedure
      ),
    };
  },
});
