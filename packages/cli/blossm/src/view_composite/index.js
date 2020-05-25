const normalize = require("@blossm/normalize-cli");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

const deploy = require("./deploy");
const init = require("./init");

const configFn = (config) => {
  return {
    name: config.name,
    operationName: trim(
      `${config.procedure}-${config.context}${
        config.service ? `-${config.service}` : ""
      }${config.domain ? `-${config.domain}` : ""}-${config.name}`,
      MAX_LENGTH
    ),
    operationHash: hash(
      config.name,
      ...(config.domain ? [config.domain] : []),
      ...(config.service ? [config.service] : []),
      config.context,
      config.procedure
    ),
  };
};

module.exports = async (args) => {
  const input = await normalize({
    entrypointType: "action",
    choices: ["deploy", "init"],
    args,
  });

  switch (input.action) {
    case "deploy":
      return deploy(input.args, configFn);
    case "init":
      return init(input.args);
  }
};
