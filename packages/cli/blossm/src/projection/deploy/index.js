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
        `${config.procedure}-${config.context}${
          config.service ? `-${config.service}` : ""
        }${config.domain ? `-${config.domain}` : ""}-${config.name}-${
          config.events.domain
        }-${config.events.service}`,
        MAX_LENGTH
      ),
      operationHash: hash(
        config.name,
        ...(config.domain ? [config.domain] : []),
        ...(config.service ? [config.service] : []),
        config.context,
        config.events.domain,
        config.events.service,
        config.procedure
      ),
    };
  },
});
