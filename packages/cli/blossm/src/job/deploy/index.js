const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "job",
  dir: __dirname,
  configFn: (config) => {
    return {
      name: config.name,
      operationHash: hash(
        config.name,
        config.domain,
        config.service,
        config.procedure
      ),
      operationName: trim(
        `${config.procedure}${config.service ? `-${config.service}` : ""}${
          config.domain ? `-${config.domain}` : ""
        }-${config.name}`,
        MAX_LENGTH
      ),
    };
  },
});
