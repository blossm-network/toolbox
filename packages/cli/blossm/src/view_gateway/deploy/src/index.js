const { promisify } = require("util");
const { readFile, readdir, unlink } = require("fs");
const yaml = require("yaml");
const gateway = require("@blossm/view-gateway");
// const eventStore = require("@blossm/event-store-rpc");
const fact = require("@blossm/fact-rpc");
const { verify: verifyGCP } = require("@blossm/gcp-kms");
const verify = require("@blossm/verify-access-token");
// const { invalidCredentials } = require("@blossm/errors");
const { download: downloadFile } = require("@blossm/gcp-storage");
const rolePermissions = require("@blossm/role-permissions");
const gcpToken = require("@blossm/gcp-token");
const uuid = require("@blossm/uuid");

const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

const config = require("./config.json");

let defaultRoles;

module.exports = gateway({
  stores: config.stores,
  whitelist: config.whitelist,
  algorithm: "ES256",
  audience: process.env.NETWORK,
  internalTokenFn: gcpToken,
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

    const roles = await fact({
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
      // customRolePermissionsFn: async ({ roleId }) => {
      //   //look through customRoles and pick out roleId
      //   const role = await eventStore({ domain: "role", service: "core" })
      //     .set({ tokenFns: { internal: gcpToken } })
      //     .query({ key: "id", value: roleId });
      //   return role.state.permissions;
      // }
    });
    // : [];
  },
  terminatedSessionCheckFn: async () => {
    // session }) => {
    // const aggregate = await eventStore({
    //   domain: "session",
    //   service: "core"
    // })
    //   .set({ tokenFns: { internal: gcpToken } })
    //   .aggregate(session);
    // if (aggregate.state.terminated) throw invalidCredentials.tokenTerminated();
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
