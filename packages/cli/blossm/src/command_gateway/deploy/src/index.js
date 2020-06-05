const gateway = require("@blossm/command-gateway");
const { verify: verifyGcp } = require("@blossm/gcp-kms");
const verify = require("@blossm/verify-access-token");
const gcpToken = require("@blossm/gcp-token");
const keyClaims = require("@blossm/key-claims");
const terminatedSession = require("@blossm/terminated-session");
const permissionsLookup = require("@blossm/permission-lookup");
const externalToken = require("@blossm/external-token");
const { download: downloadFile } = require("@blossm/gcp-storage");

const config = require("./config.json");

module.exports = gateway({
  commands: config.commands,
  whitelist: config.whitelist,
  algorithm: "ES256",
  audience: process.env.NETWORK,
  internalTokenFn: gcpToken,
  externalTokenFn: externalToken,
  permissionsLookupFn: permissionsLookup({
    token: gcpToken,
    downloadFileFn: ({ fileName, extension }) =>
      downloadFile({
        bucket: process.env.GCP_ROLES_BUCKET,
        destination: fileName + extension,
      }),
  }),
  terminatedSessionCheckFn: terminatedSession,
  verifyFn: ({ key }) =>
    key == "access" && process.env.NODE_ENV != "local"
      ? verify({
          url: process.env.PUBLIC_KEY_URL,
          algorithm: "SHA256",
        })
      : verifyGcp({
          ring: "jwt",
          key,
          location: "global",
          version: "1",
          project: process.env.GCP_PROJECT,
        }),
  keyClaimsFn: keyClaims({ token: gcpToken }),
});
