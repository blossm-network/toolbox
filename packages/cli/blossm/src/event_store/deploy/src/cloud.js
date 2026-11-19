import gcpPubsub from "@blossm/gcp-pubsub";
import eventStoreRpc from "@blossm/event-store-rpc";
import gcpKms from "@blossm/gcp-kms";
import gcpToken from "@blossm/gcp-token";
import gcpQueue from "@blossm/gcp-queue";

// Cloud-backed publication, block signing and block continuation.
const blockchainProducerKey = `producer`;
const blockchainKeyRing = `${process.env.SERVICE_NAME}-blockchain`;

let blockPublisherPublicKey;

export const publishFn = gcpPubsub.publish;

export const signFn = (message) =>
  gcpKms.sign({
    message,
    format: "base64",
    key: blockchainProducerKey,
    ring: blockchainKeyRing,
    location: "global",
    version: "1",
    project: process.env.GCP_PROJECT,
  });

export const encryptFn = (message) =>
  gcpKms.encrypt({
    message,
    key: "private",
    ring: blockchainKeyRing,
    location: "global",
    project: process.env.GCP_PROJECT,
    format: "base64",
  });

export const createBlockFn = () =>
  eventStoreRpc({ domain: process.env.DOMAIN, service: process.env.SERVICE })
    .set({
      token: { internalFn: gcpToken },
      enqueue: { fn: gcpQueue.enqueue },
    })
    .createBlock();

export const blockPublisherPublicKeyFn = async () => {
  if (!blockPublisherPublicKey) {
    blockPublisherPublicKey = await gcpKms.publicKey({
      key: blockchainProducerKey,
      ring: blockchainKeyRing,
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT,
    });
  }
  return blockPublisherPublicKey;
};
