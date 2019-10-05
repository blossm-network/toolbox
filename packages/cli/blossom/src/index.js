const normalize = require("@sustainers/normalize-cli");
const roboSay = require("@sustainers/robo-say");
const fs = require("fs");
const yaml = require("yaml");
const path = require("path");
const { red } = require("chalk");

const { init, issue } = require("./domain");

const domains = ["init", "issue"];

const tryShortcuts = input => {
  const inputPath = input.args.length == 1 ? input.args[0] : ".";
  const configPath = path.resolve(process.cwd(), inputPath, "blossom.yaml");
  const config = yaml.parse(fs.readFileSync(configPath, "utf8"));

  if (!config.context) throw "Context not set.";

  const args = [config.context];
  if (input.domain == "test") {
    args.push("deploy");
    args.push("--test-only");
  } else {
    args.push(input.domain);
  }
  args.push(...input.args);
  issue(args);
};

const forward = input => {
  switch (input.domain) {
  case "init":
    return init(input.args);
  case "issue":
    return issue(input.args);
  default: {
    try {
      tryShortcuts(input);
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error(
        roboSay(
          `This domain isn't recognized. Choose from one of these [${domains.join(
            ", "
          )}], or from one of these shortcuts [deploy, test]`
        ),
        red.bold("error")
      );
    }
  }
  }
};

exports.cli = async rawArgs => {
  const input = await normalize({
    entrypointType: "domain",
    args: rawArgs.slice(2)
  });

  forward(input);
};
