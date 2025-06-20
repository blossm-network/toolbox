import normalize from "@blossm/normalize-cli";
import hash from "@blossm/operation-hash";
import trim from "@blossm/trim-string";
import { MAX_LENGTH } from "@blossm/service-name-consts";

import deploy from "./deploy/index.js";
import init from "./init/index.js";

const configFn = (config) => {
  return {
    operationName: trim(
      `${config.procedure}${config.service ? `-${config.service}` : ""}${
        config.domain ? `-${config.domain}` : ""
      }`,
      MAX_LENGTH
    ),
    operationHash: hash(
      ...(config.domain ? [config.domain] : []),
      ...(config.service ? [config.service] : []),
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
