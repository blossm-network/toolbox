const eventStore = require("@blossm/mongodb-event-store");
const pubsub = require("@blossm/gcp-pubsub");
const { get: secret } = require("@blossm/gcp-secret");
const cononicalString = require("@blossm/cononical-string");
const hash = require("@blossm/hash");
const handlers = require("./handlers");

const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  secretFn: secret,
  publishFn: pubsub.publish,
  hashFn: (object) => {
    const message = cononicalString(object);
    return hash(message).create();
  },
  public: config.public || false,
});
