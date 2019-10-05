const normalize = require("@sustainers/normalize-cli");
const roboSay = require("@sustainers/robo-say");
const fs = require("fs");
const yaml = require("yaml");
const path = require("path");
const { red } = require("chalk");

const { init, issue } = require("./domain");

const domains = ["init", "issue"];

const forward = input => {
  switch (input.domain) {
  case "init":
    return init(input.args);
  case "issue":
    return issue(input.args);
  default: {
    const configPath = path.resolve(process.cwd(), "blossom.yaml");
    const config = yaml.parse(fs.readFileSync(configPath, "utf8"));

    if (config.domain && config.domain != input.domain) {
      input.args.unshift(config.domain);
      issue(input);
    }

    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        `This domain isn't recognized. Choose from one of these [${domains.join(
          ", "
        )}]`
      ),
      red.bold("error")
    );
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
