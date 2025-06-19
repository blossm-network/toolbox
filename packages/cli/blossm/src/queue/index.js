import normalize from "@blossm/normalize-cli";

import create from "./create/index.js";

export default async (args) => {
  const input = await normalize({
    entrypointType: "action",
    choices: ["create"],
    args,
  });

  switch (input.action) {
    case "create":
      return create(input.args);
  }
};
