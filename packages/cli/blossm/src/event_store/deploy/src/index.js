const crypto = require("crypto");
const eventStore = require("@blossm/mongodb-event-store");
const eventStoreRpc = require("@blossm/event-store-rpc");
const pubsub = require("@blossm/gcp-pubsub");
const gcpToken = require("@blossm/gcp-token");
const { enqueue } = require("@blossm/gcp-queue");
const { get: secret } = require("@blossm/gcp-secret");
const cononicalString = require("@blossm/cononical-string");
const logger = require("@blossm/logger");
const handlers = require("./handlers");
const chainpoint = require("@blossm/chainpoint");

const config = require("./config.json");

const SIX_HOURS_IN_SECONDS = 60 * 60 * 6;

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
      const submittedHashes = await chainpoint.submitHash(hash);
      return submittedHashes.map((h) => {
        return { type: "chainpoint", metadata: { proofId: h.id, uri: h.uri } };
      });
    } catch (e) {
      logger.error("Error creating proofs", { e, hash });
      return [];
    }
  },
  updateProofFn: (proofId) =>
    eventStoreRpc({ domain: process.env.DOMAIN, service: process.env.SERVICE })
      .set({
        token: { internalFn: gcpToken },
        enqueue: { fn: enqueue, wait: SIX_HOURS_IN_SECONDS },
      })
      .updateProof(proofId),
});
