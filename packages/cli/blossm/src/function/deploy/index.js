const deployCliTemplate = require("@blossm/deploy-cli-template");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = deployCliTemplate({
  domain: "function",
  dir: __dirname,
  configFn: (config) => {
    return {
      name: config.name,
      operationHash: hash(config.name, config.procedure),
      operationName: trim(`${config.procedure}-${config.name}`, MAX_LENGTH),
    };
  },
});
