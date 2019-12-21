const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/service-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "job",
  dir: __dirname,
  configFn: config => {
    return {
      name: config.name,
      operationHash: hash({
        procedure: [config.name, config.domain, config.context],
        service: config.service
      }),
      operationName: trim(
        `${config.service}-${config.context}-${config.domain}-${config.name}`,
        MAX_LENGTH
      )
    };
  }
});
