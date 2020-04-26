const eventHandler = require("@blossm/mongodb-event-handler");

const main = require("./main.js");

module.exports = eventHandler({ mainFn: main });
