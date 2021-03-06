const gateway = require("@blossm/view-gateway");
const { verify: verifyGcp } = require("@blossm/gcp-kms");
const verify = require("@blossm/verify-access-token");
const gcpToken = require("@blossm/gcp-token");
// const terminatedSessionCheck = require("@blossm/terminated-session-check");
// const deletedSceneCheck = require("@blossm/deleted-scene-check");
const permissionsLookup = require("@blossm/permissions-lookup");
const nodeExternalToken = require("@blossm/node-external-token");
const { download: downloadFile } = require("@blossm/gcp-storage");

const config = require("./config.json");

module.exports = gateway({
  views: config.views.map((view) => ({
    ...view,
    ...(view.network && {
      network:
        view.network == "$base" ? process.env.BASE_NETWORK : view.network,
    }),
  })),
  allow: config.allow,
  algorithm: "ES256",
  audience: process.env.NETWORK,
  redirect: config.redirect || "/auth",
  internalTokenFn: gcpToken,
  nodeExternalTokenFn: nodeExternalToken,
  permissionsLookupFn: permissionsLookup({
    downloadFileFn: ({ fileName, extension }) =>
      downloadFile({
        bucket: process.env.GCP_ROLES_BUCKET,
        destination: fileName + extension,
      }),
  }),
  terminatedSessionCheckFn: () => {}, //terminatedSessionCheck,
  deletedSceneCheckFn: () => {}, //deletedSceneCheck,
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
});
