const yaml = require("yaml");
const { readFile, readdir, unlink } = require("fs");
const { promisify } = require("util");
const gateway = require("@blossm/command-gateway");
const eventStore = require("@blossm/event-store-rpc");
const secret = require("@blossm/gcp-secret");
const fact = require("@blossm/fact-rpc");
const { verify: verifyGCP } = require("@blossm/gcp-kms");
const verify = require("@blossm/verify-access-token");
const { invalidCredentials } = require("@blossm/errors");
const gcpToken = require("@blossm/gcp-token");
const connectionToken = require("@blossm/connection-token");
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
  algorithm: "ES256",
  internalTokenFn: gcpToken,
  externalTokenFn: connectionToken({
    credentialsFn: async ({ network }) => {
      const nameRoot = network
        .toUpperCase()
        .split(".")
        .join("_");

      const id = process.env[`${nameRoot}_KEY_ID`];
      const secretName = process.env[`${nameRoot}_KEY_SECRET_NAME`];

      if (!id || !secretName) return null;
      return {
        id,
        secret: await secret(secretName)
      };
    }
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

    const roles = await fact({
      name: "roles",
      domain: "principle",
      service: "core",
      network: process.env.ROLE_NETWORK
    })
      .set({
        tokenFns: { internal: gcpToken },
        context: { network: process.env.NETWORK }
      })
      .read({ root: principle.root });

    //TODO
    //eslint-disable-next-line
    console.log({ roles, defaultRoles });
    return await rolePermissions({
      roles,
      defaultRoles,
      context
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
  //TODO look at removing this to prevent cross network event store lookup.
  terminatedSessionCheckFn: async ({ session }) => {
    const aggregate = await eventStore({
      domain: "session",
      service: "core"
    })
      .set({ tokenFns: { internal: gcpToken } })
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
      .set({ tokenFns: { internal: gcpToken } })
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
