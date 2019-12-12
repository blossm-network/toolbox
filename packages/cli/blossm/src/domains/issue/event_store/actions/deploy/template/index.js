const eventStore = require("@blossm/mongodb-event-store");
const pubsub = require("@blossm/gcp-pubsub");

const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema,
  publishFn: pubsub.publish
});
