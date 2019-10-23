const deployCliTemplate = require("@sustainers/deploy-cli-template");
const hash = require("@sustainers/hash-string");
const trim = require("@sustainers/trim-string");
const { MAX_LENGTH } = require("@sustainers/service-name-consts");

module.exports = deployCliTemplate({
  domain: "gateway",
  dir: __dirname,
  configFn: config => {
    const testAction = "some-action";
    const testDomain = "some-domain";
    return {
      _OPERATION_HASH: hash(config.context + config.service).toString(),
      _OPERATION_NAME: trim(`${config.service}-${config.context}`, MAX_LENGTH),
      _TEST_ACTION: testAction,
      _TEST_DOMAIN: testDomain,
      _COMMAND_HANDLER_HASH: hash(
        `${config.action}${config.domain}command-handler${config.service}`
      ).toString(),
      _EVENT_STORE_HASH: hash(
        `${config.domain}event-store${config.service}`
      ).toString()
    };
  }
});
