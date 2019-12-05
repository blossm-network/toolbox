const normalize = require("@blossm/normalize-cli");

const commandHandler = require("./command_handler");
const eventHandler = require("./event_handler");
const eventStore = require("./event_store");
const viewStore = require("./view_store");
const authGateway = require("./auth_gateway");

const templates = [
  "command-handler",
  "event-handler",
  "view-store",
  "event-store",
  "auth-gateway"
];

module.exports = async args => {
  const input = await normalize({
    entrypointType: "template",
    choices: templates,
    args
  });
  switch (input.template) {
    case "command-handler":
      return commandHandler(input.args);
    case "event-handler":
      return eventHandler(input.args);
    case "event-store":
      return eventStore(input.args);
    case "view-store":
      return viewStore(input.args);
    case "auth-gateway":
      return authGateway(input.args);
  }
};
