import normalize from "@blossm/normalize-cli";

import upload from "./upload/index.js";

export default async (args) => {
  const input = await normalize({
    entrypointType: "action",
    choices: ["upload"],
    args,
  });

  switch (input.action) {
    case "upload":
      return upload(input.args);
  }
};
