const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/service-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "view-store",
  dir: __dirname,
  configFn: config => {
    return {
      name: config.name,
      operationName: trim(
        `${config.service}-${config.context}-${config.domain}-${config.name}`,
        MAX_LENGTH
      ),
      operationHash: hash({
        procedure: [config.name, config.domain, config.context],
        service: config.service
      })
    };
  }
});
