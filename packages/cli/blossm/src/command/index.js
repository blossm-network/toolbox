import normalize from "@blossm/normalize-cli";
import hash from "@blossm/operation-hash";
import trim from "@blossm/trim-string";
import serviceNameConsts from "@blossm/service-name-consts";

import deploy from "./deploy/index.js";
import init from "./init/index.js";

const { MAX_LENGTH } = serviceNameConsts;

const configFn = (config) => {
  return {
    name: config.name,
    operationHash: hash(
      config.name,
      config.domain,
      config.service,
      config.procedure
    ),
    operationName: trim(
      `${config.procedure}-${config.service}-${config.domain}-${config.name}`,
      MAX_LENGTH
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
