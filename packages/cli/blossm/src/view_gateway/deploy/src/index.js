import gateway from "@blossm/view-gateway";
import gcpKms from "@blossm/gcp-kms";
import verify from "@blossm/verify-access-token";
import gcpToken from "@blossm/gcp-token";
// import terminatedSessionCheck from "@blossm/terminated-session-check";
// import deletedSceneCheck from "@blossm/deleted-scene-check";
import permissionsLookup from "@blossm/permissions-lookup";
import nodeExternalToken from "@blossm/node-external-token";
import gcpStorage from "@blossm/gcp-storage";

import config from "./config.json" with { type: "json" };

export default gateway({
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
      gcpStorage.download({
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
      : gcpKms.verify({
          ring: "jwt",
          key,
          location: "global",
          version: "1",
          project: process.env.GCP_PROJECT,
        }),
});
