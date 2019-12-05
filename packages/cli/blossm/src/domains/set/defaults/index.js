const normalize = require("@blossm/normalize-cli");

const viewStore = require("./view_store");
const eventStore = require("./event_store");
const cloud = require("./cloud");

module.exports = async args => {
  const input = await normalize({
    entrypointType: "context",
    choices: ["view-store", "event-store", "cloud"],
    args
  });

  switch (input.context) {
    case "view-store":
      return viewStore(input.args);
    case "event-store":
      return eventStore(input.args);
    case "cloud":
      return cloud(input.args);
  }
};
