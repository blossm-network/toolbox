const eventStore = require("@blossm/mongodb-event-store");
const pubsub = require("@blossm/gcp-pubsub");
const { get: secret } = require("@blossm/gcp-secret");
const { encrypt } = require("@blossm/gcp-kms");
const cononicalString = require("@blossm/cononical-string");
const handlers = require("./handlers");
const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  secretFn: secret,
  publishFn: pubsub.publish,
  hashFn: async (object) => {
    const message = cononicalString(object);
    const encrypted = await encrypt({
      message,
      format: "hex",
      key: "signature",
      ring: "event-hash",
      location: "global",
      project: process.env.GCP_PROJECT,
    });
    //TODO
    //eslint-disable-next-line no-console
    console.log({ encrypted });
    return encrypted;
  },
});
