import hash from "@blossm/operation-hash";
import operationShortName from "@blossm/operation-short-name";
import normalize from "@blossm/normalize-cli";

import deploy from "./deploy/index.js";
import execute from "./execute/index.js";
import init from "./init/index.js";

const configFn = (config) => {
  return {
    name: config.name,
    operationHash: hash(
      config.name,
      ...(config.domain ? [config.domain] : []),
      ...(config.service ? [config.service] : []),
      config.procedure
    ),
    operationName: operationShortName(
      [config.name, config.domain, config.service, config.procedure]
    ),
  };
};

export default async (args) => {
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
