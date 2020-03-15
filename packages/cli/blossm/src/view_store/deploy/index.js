const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "view-store",
  dir: __dirname,
  configFn: config => {
    return {
      name: config.name,
      operationName: trim(
        `${config.procedure}-${config.service}-${config.domain}-${config.name}`,
        MAX_LENGTH
      ),
      operationHash: hash(
        config.name,
        config.domain,
        config.service,
        config.procedure
      )
    };
  }
});
