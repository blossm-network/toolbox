const normalize = require("@sustainers/normalize-cli");

const { deploy } = require("./actions");

const actions = ["deploy"];

module.exports = async args => {
  const input = await normalize({
    entrypointType: "action",
    choices: actions,
    args
  });

  //eslint-disable-next-line no-console
  console.log("in view store: ", { input });

  switch (input.action) {
  case "deploy":
    return deploy(input.args);
  }
};
