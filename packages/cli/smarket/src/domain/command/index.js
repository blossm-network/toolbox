const normalize = require("@sustainers/normalize-cli");

const eventStore = require("./event_store");
const viewStore = require("./view_store");

const domains = ["view-store", "event-store"];

module.exports = async args => {
  const input = await normalize({
    entrypointType: "domain",
    choices: domains,
    args
  });

  switch (input.domain) {
  case "view-store":
    return viewStore(input.args);
  case "event-store":
    return eventStore(input.args);
  }
};
