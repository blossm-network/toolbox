const eventStore = require("@blossm/mongodb-event-store");
const pubsub = require("@blossm/gcp-pubsub");
const gcpToken = require("@blossm/gcp-token");
const rpc = require("@blossm/rpc");

const handlers = require("./handlers");
const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  publishFn: pubsub.publish,
});
