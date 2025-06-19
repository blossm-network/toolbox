import fs from "fs";
import path from "path";
import gateway from "@blossm/command-gateway";
import { verify as verifyGcp } from "@blossm/gcp-kms";
import verify from "@blossm/verify-access-token";
import gcpToken from "@blossm/gcp-token";
import keyClaims from "@blossm/key-claims";
import terminatedSessionCheck from "@blossm/terminated-session-check";
import deletedSceneCheck from "@blossm/deleted-scene-check";
import permissionsLookup from "@blossm/permissions-lookup";
import nodeExternalToken from "@blossm/node-external-token";
import { download as downloadFile } from "@blossm/gcp-storage";

import config from "./config.json";

const services =
  fs.existsSync(path.resolve(__dirname, "./services.js")) &&
  import("./services.js");

export default gateway({
  commands: config.commands.map((command) => ({
    ...command,
    ...(command.network && {
      network:
        command.network == "$base" ? process.env.BASE_NETWORK : command.network,
    }),
  })),
  allow: config.allow,
  algorithm: "ES256",
  audience: process.env.NETWORK,
  internalTokenFn: gcpToken,
  redirect: config.redirect || "/auth",
  nodeExternalTokenFn: nodeExternalToken,
  permissionsLookupFn: permissionsLookup({
    downloadFileFn: ({ fileName, extension }) =>
      downloadFile({
        bucket: process.env.GCP_ROLES_BUCKET,
        destination: fileName + extension,
      }),
  }),
  terminatedSessionCheckFn: terminatedSessionCheck,
  deletedSceneCheckFn: deletedSceneCheck,
  ...(services && { services }),
  verifyFn: ({ key }) =>
    // The public key is an access key.
    // The local dev uses the images from the base network that uses gcp keys.
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
