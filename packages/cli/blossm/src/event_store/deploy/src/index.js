const eventStore = require("@blossm/mongodb-event-store");
const pubsub = require("@blossm/gcp-pubsub");
const { get: secret } = require("@blossm/gcp-secret");
const { sign, encrypt, publicKey } = require("@blossm/gcp-kms");
const handlers = require("./handlers");

const config = require("./config.json");

const blockchainProducerKey = "producer";
const blockchainProducerKeyRing = "blockchain";

let blockPublisherPublicKey;

module.exports = eventStore({
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  secretFn: secret,
  publishFn: pubsub.publish,
  signFn: (message) =>
    sign({
      message,
      format: "hex",
      key: blockchainProducerKey,
      ring: blockchainProducerKeyRing,
      location: "global",
      version: 0,
      project: process.env.GCP_PROJECT,
    }),
  encryptFn: (message) =>
    encrypt({
      message,
      key: "private",
      ring: "blockchain",
      location: "global",
      project: process.env.GCP_PROJECT,
      format: "hex",
    }),
  blockPublisherPublicKeyFn: async () => {
    if (!blockPublisherPublicKey) {
      blockPublisherPublicKey = await publicKey({
        key: blockchainProducerKey,
        ring: blockchainProducerKeyRing,
        location: "global",
        version: "0",
        project: process.env.GCP_PROJECT,
      });
    }
    return blockPublisherPublicKey;
  },
  public: config.public || false,
});
