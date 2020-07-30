const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const fs = require("fs");
const yaml = require("yaml");
const path = require("path");
const { red } = require("chalk");

const init = require("./init");
const secret = require("./secret");
const queue = require("./queue");
const command = require("./command");
const projection = require("./projection");
const eventStore = require("./event_store");
const viewStore = require("./view_store");
const commandGateway = require("./command_gateway");
const viewGateway = require("./view_gateway");
const factGateway = require("./fact_gateway");
const roles = require("./roles");
const job = require("./job");
const fact = require("./fact");
const viewComposite = require("./view_composite");

const domains = [
  "begin",
  "config",
  "init",
  "set",
  "command",
  "roles",
  "projection",
  "view-store",
  "event-store",
  "command-gateway",
  "view-gateway",
  "fact-gateway",
  "job",
  "function",
  "fact",
  "view-composite",
];

const tryShortcuts = (input) => {
  const inputPath =
    input.positionalArgs.length >
    input.args.filter((a) => a.startsWith("-")).length
      ? input.positionalArgs[0]
      : ".";
  const configPath = path.resolve(process.cwd(), inputPath, "blossm.yaml");
  const config = yaml.parse(fs.readFileSync(configPath, "utf8"));

  if (!config.procedure) throw "Procedure not set.";

  const args = [];

  if (input.domain == "test") {
    args.push("deploy");
    args.push("--unit-test");
  } else {
    args.push(input.domain);
  }
  args.push(...input.args);

  switch (config.procedure) {
    case "command":
      return command(args);
    case "projection":
      return projection(args);
    case "event-store":
      return eventStore(args);
    case "view-store":
      return viewStore(args);
    case "command-gateway":
      return commandGateway(args);
    case "view-gateway":
      return viewGateway(args);
    case "fact-gateway":
      return factGateway(args);
    case "roles":
      return roles(args);
    case "job":
      return job(args);
    case "fact":
      return fact(args);
    case "view-composite":
      return viewComposite(args);
  }
};

const forward = (input) => {
  switch (input.domain) {
    case "init":
      return init(input.args);
    case "secret":
      return secret(input.args);
    case "queue":
      return queue(input.args);
    case "command":
      return command(input.args);
    case "projection":
      return projection(input.args);
    case "event-store":
      return eventStore(input.args);
    case "view-store":
      return viewStore(input.args);
    case "command-gateway":
      return commandGateway(input.args);
    case "roles":
      return roles(input.args);
    case "view-gateway":
      return viewGateway(input.args);
    case "fact-gateway":
      return factGateway(input.args);
    case "job":
      return job(input.args);
    case "fact":
      return fact(input.args);
    case "view-composite":
      return viewComposite(input.args);
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

exports.cli = async (rawArgs) => {
  const input = await normalize({
    entrypointType: "domain",
    args: rawArgs.slice(2),
  });

  forward(input);
};
