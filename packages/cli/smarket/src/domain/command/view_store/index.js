const normalize = require("@sustainers/normalize-cli");

const { deploy } = require("./action");

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
