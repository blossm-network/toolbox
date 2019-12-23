const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/service-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "command-gateway",
  dir: __dirname,
  configFn: config => {
    return {
      operationName: trim(
        `${config.service}-${config.context}-${config.domain}`,
        MAX_LENGTH
      ),
      operationHash: hash({
        procedure: [config.domain, config.context],
        service: config.service
      })
    };
  }
});
