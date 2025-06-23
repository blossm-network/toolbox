import eventStore from "@blossm/mongodb-event-store";
import pubsub from "@blossm/gcp-pubsub";
import eventStoreRpc from "@blossm/event-store-rpc";
import { get as secret } from "@blossm/gcp-secret";
import { sign, encrypt, publicKey } from "@blossm/gcp-kms";
import gcpToken from "@blossm/gcp-token";
import gcpQueue from "@blossm/gcp-queue";
import handlers from "./handlers.js";

import config from "./config.json" with { type: "json" };

const blockchainProducerKey = `producer`;
const blockchainKeyRing = `${process.env.SERVICE_NAME}-blockchain`;

let blockPublisherPublicKey;

export default eventStore({
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  secretFn: secret,
  publishFn: pubsub.publish,
  signFn: (message) =>
    sign({
      message,
      format: "base64",
      key: blockchainProducerKey,
      ring: blockchainKeyRing,
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT,
    }),
  encryptFn: (message) =>
    encrypt({
      message,
      key: "private",
      ring: blockchainKeyRing,
      location: "global",
      project: process.env.GCP_PROJECT,
      format: "base64",
    }),
  createBlockFn: () =>
    eventStoreRpc({ domain: process.env.DOMAIN, service: process.env.SERVICE })
      .set({
        token: { internalFn: gcpToken },
        enqueue: { fn: gcpQueue.enqueue },
      })
      .createBlock(),
  blockPublisherPublicKeyFn: async () => {
    if (!blockPublisherPublicKey) {
      blockPublisherPublicKey = await publicKey({
        key: blockchainProducerKey,
        ring: blockchainKeyRing,
        location: "global",
        version: "1",
        project: process.env.GCP_PROJECT,
      });
    }
    return blockPublisherPublicKey;
  },
  isPublic: config.isPublic || false,
});
