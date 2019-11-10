const eventStore = require("@blossm/event-store");

const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema
});
