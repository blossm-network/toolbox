const { promisify } = require("util");
const { readFile, readdir, unlink } = require("fs");
const yaml = require("yaml");
const gateway = require("@blossm/fact-gateway");
// const eventStore = require("@blossm/event-store-rpc");
const fact = require("@blossm/fact-rpc");
const { verify: verifyGCP } = require("@blossm/gcp-kms");
const { get: secret } = require("@blossm/gcp-secret");
const verify = require("@blossm/verify-access-token");
const { invalidCredentials } = require("@blossm/errors");
const { download: downloadFile } = require("@blossm/gcp-storage");
const rolePermissions = require("@blossm/role-permissions");
const gcpToken = require("@blossm/gcp-token");
const connectionToken = require("@blossm/connection-token");
const uuid = require("@blossm/uuid");

const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

const config = require("./config.json");

let defaultRoles;

module.exports = gateway({
  facts: config.facts,
  whitelist: config.whitelist,
  algorithm: "ES256",
  audience: process.env.NETWORK,
  internalTokenFn: gcpToken,
  externalTokenFn: connectionToken({
    credentialsFn: async ({ network }) => {
      const nameRoot = network.toUpperCase().split(".").join("_");

      const id = process.env[`${nameRoot}_KEY_ID`];
      const secretName = process.env[`${nameRoot}_KEY_SECRET_NAME`];

      if (!id || !secretName) return null;
      return {
        id,
        secret: await secret(secretName),
      };
    },
  }),
  //roles are the roles that the principle has.
  permissionsLookupFn: async ({ principle, context }) => {
    //Download files if they aren't downloaded already.
    if (!defaultRoles) {
      const fileName = uuid();
      const extension = ".yaml";
      defaultRoles = {};
      await downloadFile({
        bucket: process.env.GCP_ROLES_BUCKET,
        destination: fileName + extension,
      });
      const files = (await readDirAsync(".")).filter(
        (file) => file.startsWith(fileName) && file.endsWith(extension)
      );

      await Promise.all(
        files.map(async (file) => {
          const role = await readFileAsync(file);
          const defaultRole = yaml.parse(role.toString());
          defaultRoles = {
            ...defaultRoles,
            ...defaultRole,
          };
          await unlinkAsync(file);
        })
      );
    }

    const { body: roles } = await fact({
      name: "roles",
      domain: "principle",
      service: principle.service,
      network: principle.network,
    })
      .set({
        tokenFns: { internal: gcpToken },
        context: { network: process.env.NETWORK },
      })
      .read({ root: principle.root });

    return await rolePermissions({
      roles,
      defaultRoles,
      context,
      customRolePermissionsFn: async ({ roleId }) => {
        const { body: permissions } = await fact({
          name: "permissions",
          domain: "role",
          service: "core",
          ...(process.env.CORE_NETWORK && {
            network: process.env.CORE_NETWORK,
          }),
        })
          .set({
            tokenFns: { internal: gcpToken },
            context: { network: process.env.NETWORK },
          })
          .read({ id: roleId });

        return permissions;
      },
    });
  },
  terminatedSessionCheckFn: async ({ session }) => {
    const { body: terminated } = await fact({
      name: "terminated",
      domain: "session",
      service: session.service,
      network: session.network,
    })
      .set({
        tokenFns: { internal: gcpToken },
        context: { session },
      })
      .read();

    if (terminated) throw invalidCredentials.tokenTerminated();
  },
  verifyFn: ({ key }) =>
    key == "access"
      ? verify({
          url: process.env.PUBLIC_KEY_URL,
          algorithm: "SHA256",
        })
      : verifyGCP({
          ring: "jwt",
          key,
          location: "global",
          version: "1",
          project: process.env.GCP_PROJECT,
        }),
});
