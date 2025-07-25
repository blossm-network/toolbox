import normalize from "@blossm/normalize-cli";
import hash from "@blossm/operation-hash";

import deploy from "./deploy/index.js";
import init from "./init/index.js";

const configFn = (config) => {
  return {
    operationName: operationShortName([config.context, config.procedure]),
    operationHash: hash(
      ...(config.context ? [config.context] : []),
      config.procedure
    ),
  };
};

export default async (args) => {
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
