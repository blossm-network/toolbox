const normalize = require("@blossm/normalize-cli");

const upload = require("./upload");

module.exports = async (args) => {
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
