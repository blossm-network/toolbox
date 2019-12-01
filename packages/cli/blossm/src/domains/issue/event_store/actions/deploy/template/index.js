const eventStore = require("@blossm/mongodb-event-store");

const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema
});
