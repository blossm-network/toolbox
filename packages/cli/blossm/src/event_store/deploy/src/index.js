const crypto = require("crypto");
const eventStore = require("@blossm/mongodb-event-store");
const pubsub = require("@blossm/gcp-pubsub");
const { get: secret } = require("@blossm/gcp-secret");
const cononicalString = require("@blossm/cononical-string");
const handlers = require("./handlers");
const chainpoint = require("@blossm/chainpoint");

const config = require("./config.json");

module.exports = eventStore({
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  secretFn: secret,
  publishFn: pubsub.publish,
  hashFn: async (object) => {
    const message = cononicalString(object);
    return crypto.createHash("sha256").update(message).digest("hex");
  },
  proofFn: async (hash) => {
    if (
      process.env.NODE_ENV != "production" ||
      process.env.NODE_ENV != "sandbox"
    )
      return { type: "none", id: "none" };
    const { hashIdNode: id } = await chainpoint.submitHashes([hash]);
    return { type: "chainpoint", id };
  },
});
