import crypto from "crypto";
import eventStoreRpc from "@blossm/event-store-rpc";

// Local mode is a disposable fixture: it signs and encrypts blocks with keys
// that live only in this process and never contacts KMS, Pub/Sub or Tasks.
// Each block carries its public key, so its signature stays verifiable.
const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "P-256",
});
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
const encryptionKey = crypto.randomBytes(32);

// The local store keeps no pending publications, so nothing calls this.
export const publishFn = async () => {
  throw new Error("Local mode does not publish.");
};

export const signFn = async (message) =>
  crypto.createSign("SHA256").update(message).sign(privateKey, "base64");

export const encryptFn = async (message) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  return Buffer.concat([
    iv,
    cipher.update(message),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
};

// A full block continues with a direct local request instead of a queued task.
export const createBlockFn = () =>
  eventStoreRpc({
    domain: process.env.DOMAIN,
    service: process.env.SERVICE,
  }).createBlock();

export const blockPublisherPublicKeyFn = async () => publicKeyPem;
