const normalize = require("@sustainers/normalize-cli");
const { init, command } = require("./domain");
const domains = ["init", "command"];

exports.cli = async rawArgs => {
  const input = await normalize({
    entrypointType: "domain",
    choices: domains,
    args: rawArgs.slice(2)
  });

  switch (input.domain) {
  case "init":
    return init(input.args);
  case "command":
    return command(input.args);
  }
};
