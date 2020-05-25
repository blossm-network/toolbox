const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");
const normalize = require("@blossm/normalize-cli");

const deploy = require("./deploy");
const execute = require("./execute");
const init = require("./init");

const configFn = (config) => {
  return {
    name: config.name,
    operationHash: hash(
      config.name,
      ...(config.domain ? [config.domain] : []),
      ...(config.service ? [config.service] : []),
      config.procedure
    ),
    operationName: trim(
      `${config.procedure}${config.service ? `-${config.service}` : ""}${
        config.domain ? `-${config.domain}` : ""
      }-${config.name}`,
      MAX_LENGTH
    ),
  };
};

module.exports = async (args) => {
  const input = await normalize({
    entrypointType: "action",
    choices: ["deploy", "execute", "init"],
    args,
  });

  switch (input.action) {
    case "deploy":
      return deploy(input.args, configFn);
    case "execute":
      return execute(input.args, configFn);
    case "init":
      return init(input.args);
  }
};
