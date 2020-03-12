const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "command-gateway",
  dir: __dirname,
  configFn: config => {
    return {
      operationName: trim(
        `${config.service}-${config.procedure}-${config.domain}`,
        MAX_LENGTH
      ),
      operationHash: hash(config.domain, config.service, config.procedure)
    };
  }
});
