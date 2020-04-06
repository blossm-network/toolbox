const yaml = require("yaml");
const { readFile, readdir, unlink } = require("fs");
const { promisify } = require("util");
const gateway = require("@blossm/command-gateway");
const eventStore = require("@blossm/event-store-rpc");
const { verify: verifyGCP } = require("@blossm/gcp-kms");
const { verify } = require("@blossm/verify-access-token");
const { invalidCredentials } = require("@blossm/errors");
const gcpToken = require("@blossm/gcp-token");
const { download: downloadFile } = require("@blossm/gcp-storage");
const rolePermissions = require("@blossm/role-permissions");
const { compare } = require("@blossm/crypt");
const uuid = require("@blossm/uuid");

const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

const config = require("./config.json");

let defaultRoles;

module.exports = gateway({
  commands: config.commands,
  whitelist: config.whitelist,
  tokenFn: gcpToken,
  //roles are the roles that the principle has.
  permissionsLookupFn: async ({ roles }) => {
    if (!defaultRoles) {
      const fileName = uuid();
      const extension = ".yaml";
      defaultRoles = {};
      await downloadFile({
        bucket: process.env.GCP_ROLES_BUCKET,
        destination: fileName + extension
      });
      const files = (await readDirAsync(".")).filter(
        file => file.startsWith(fileName) && file.endsWith(extension)
      );

      await Promise.all(
        files.map(async file => {
          const role = await readFileAsync(file);
          const defaultRole = yaml.parse(role.toString());
          defaultRoles = {
            ...defaultRoles,
            ...defaultRole
          };
          await unlinkAsync(file);
        })
      );
    }

    // //TODO
    // //The sustainers network needs to attach this to the context.
    // const aggregate = await eventStore({
    //   domain: "principle",
    //   service: "core"
    // })
    //   .set({ tokenFn: gcpToken })
    //   .aggregate(principle.root);

    // return aggregate
    //   ? await rolePermissions({
    await rolePermissions({
      roles,
      // : aggregate.state.roles.map(role => role.id),
      defaultRoles
      // customRolePermissionsFn: async ({ roleId }) => {
      //   //look through customRoles and pick out roleId
      //   const role = await eventStore({ domain: "role", service: "core" })
      //     .set({ tokenFn: gcpToken })
      //     .query({ key: "id", value: roleId });
      //   return role.state.permissions;
      // }
    });
    // : [];
  },
  //TODO look at removing this to prevent cross network event store lookup.
  terminatedSessionCheckFn: async ({ session }) => {
    const aggregate = await eventStore({
      domain: "session",
      service: "core"
    })
      .set({ tokenFn: gcpToken })
      .aggregate(session);

    if (aggregate.state.terminated) throw invalidCredentials.tokenTerminated();
  },
  verifyFn: ({ key }) =>
    key == "access"
      ? verify({
          url: process.env.PUBLIC_KEY_URL,
          algorithm: "SHA256"
        })
      : verifyGCP({
          ring: "jwt",
          key,
          location: "global",
          version: "1",
          project: process.env.GCP_PROJECT
        }),
  keyClaimsFn: async ({ id, secret, domain = "node" }) => {
    const [key] = await eventStore({ domain: "key", service: "core" })
      .set({ tokenFn: gcpToken })
      .query({ key: "id", value: id });

    if (!key) throw "Key not found";

    if (!(await compare(secret, key.state.secret))) throw "Incorrect secret";

    return {
      context: {
        key: {
          root: key.headers.root,
          service: "core",
          network: process.env.NETWORK
        },
        principle: key.state.principle,
        [domain]: key.state[domain],
        domain
      }
    };
  }
});
