const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "projection",
  dir: __dirname,
  configFn: (config) => {
    return {
      name: config.name,
      operationName: trim(
        `${config.procedure}-${config.context}-${config.name}${
          config.domain ? `-${config.domain}` : ""
        }-did-${config.event.action}-${config.event.domain}`,
        MAX_LENGTH
      ),
      operationHash: hash(
        config.name,
        ...(config.domain ? [config.domain] : []),
        config.context,
        config.event.action,
        config.event.domain,
        config.event.service,
        config.procedure
      ),
    };
  },
});
