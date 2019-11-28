const eventHandler = require("@blossm/event-handler");

const main = require("./main.js");

module.exports = eventHandler({
  mainFn: main
});
