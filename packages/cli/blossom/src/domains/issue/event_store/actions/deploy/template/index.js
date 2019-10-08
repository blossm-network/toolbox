const eventStore = require("@sustainers/event-store");

const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema
});
