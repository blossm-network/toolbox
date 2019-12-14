const normalize = require("@blossm/normalize-cli");

const deploy = require("./deploy");

const actions = ["deploy"];

module.exports = async args => {
  const input = await normalize({
    entrypointType: "action",
    choices: actions,
    args
  });

  switch (input.action) {
    case "deploy":
      return deploy(input.args);
  }
};
