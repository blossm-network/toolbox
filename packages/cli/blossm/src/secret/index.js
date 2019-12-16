const normalize = require("@blossm/normalize-cli");

const create = require("./create");

module.exports = async args => {
  const input = await normalize({
    entrypointType: "action",
    choices: ["create"],
    args
  });

  switch (input.action) {
    case "create":
      return create(input.args);
  }
};
