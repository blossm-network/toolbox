const normalize = require("@sustainers/normalize-cli");
const { init, issue } = require("./domain");
const domains = ["init", "issue"];

exports.cli = async rawArgs => {
  const input = await normalize({
    entrypointType: "domain",
    choices: domains,
    args: rawArgs.slice(2)
  });

  switch (input.domain) {
  case "init":
    return init(input.args);
  case "issue":
    return issue(input.args);
  }
};
