const normalize = require("@blossm/normalize-cli");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

const deploy = require("./deploy");
const init = require("./init");

const configFn = (config) => {
  return {
    operationName: trim(
      `${config.procedure}${config.context ? `-${config.context}` : ""}`,
      MAX_LENGTH
    ),
    operationHash: hash(
      ...(config.context ? [config.context] : []),
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
