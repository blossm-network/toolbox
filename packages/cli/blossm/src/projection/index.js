import normalize from "@blossm/normalize-cli";
import hash from "@blossm/operation-hash";

import deploy from "./deploy/index.js";
import init from "./init/index.js";
import replay from "./replay/index.js";

const configFn = (config) => {
  return {
    name: config.name,
    operationName: operationShortName([config.name, config.context, config.procedure]),
    operationHash: hash(
      config.name,
      ...(config.context ? [config.context] : []),
      config.procedure
    ),
  };
};

export default async (args) => {
  const input = await normalize({
    entrypointType: "action",
    choices: ["deploy", "init", "replay"],
    args,
  });

  switch (input.action) {
    case "deploy":
      return deploy(input.args, configFn);
    case "init":
      return init(input.args);
    case "replay":
      return replay(input.args, configFn);
  }
};
