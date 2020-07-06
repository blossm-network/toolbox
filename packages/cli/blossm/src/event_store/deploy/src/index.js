const crypto = require("crypto");
const eventStore = require("@blossm/mongodb-event-store");
const pubsub = require("@blossm/gcp-pubsub");
const { get: secret } = require("@blossm/gcp-secret");
const cononicalString = require("@blossm/cononical-string");
const logger = require("@blossm/logger");
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
  proofsFn: async (hash) => {
    if (
      process.env.NODE_ENV != "production" &&
      process.env.NODE_ENV != "sandbox"
    )
      return [];

    try {
      const submittedHashes = await chainpoint.submitHashes(hash);
      return submittedHashes.map((h) => {
        return { type: "chainpoint", id: h.id, metadata: { uri: h.uri } };
      });
    } catch (e) {
      logger.error("Error creating proofs", { e, hash });
      return [];
    }
  },
});
