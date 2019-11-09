const eventHandler = require("@sustainers/event-handler");

const main = require("./main.js");

module.exports = eventHandler({
  mainFn: main
});
