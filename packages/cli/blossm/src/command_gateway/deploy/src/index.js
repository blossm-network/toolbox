const yaml = require("yaml");
const gateway = require("@blossm/command-gateway");
const eventStore = require("@blossm/event-store-rpc");
const { verify } = require("@blossm/gcp-kms");
const { invalidCredentials } = require("@blossm/errors");
const gcpToken = require("@blossm/gcp-token");
const { download: downloadFile } = require("@blossm/gcp-storage");
const rolePermissions = require("@blossm/role-permissions");
const { compare } = require("@blossm/crypt");

const config = require("./config.json");

let defaultRoles;

module.exports = gateway({
  commands: config.commands,
  whitelist: config.whitelist,
  permissionsLookupFn: async ({ principle }) => {
    if (!defaultRoles) {
      await downloadFile({
        bucket: process.env.GCP_ROLES_BUCKET,
        file: `${process.env.SERVICE}/${process.env.DOMAIN}/roles.yaml`
      });
      defaultRoles = yaml.parse(defaultRoles.yaml);
    }

    const aggregate = await eventStore({
      domain: "principle"
    })
      .set({ tokenFn: gcpToken })
      .aggregate(principle);

    return aggregate
      ? await rolePermissions({
          roles: aggregate.state.roles.map(role => role.id),
          defaultRoles,
          customRolePermissionsFn: async ({ roleId }) => {
            const role = await eventStore({ domain: "role" })
              .set({ tokenFn: gcpToken })
              .query({ key: "id", value: roleId });
            return role.state.permissions;
          }
        })
      : [];
  },
  terminatedSessionCheckFn: async ({ session }) => {
    const aggregate = await eventStore({
      domain: "session"
    })
      .set({ tokenFn: gcpToken })
      .aggregate(session);

    if (aggregate.state.terminated) throw invalidCredentials.tokenTerminated();
  },
  verifyFn: ({ key }) =>
    verify({
      ring: "jwt",
      key,
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    }),
  //TODO
  //eslint-disable-next-line
  tokenClaimsFn: async ({ header }) => {
    const id = "some-key-id";
    const secret = "some-secret";

    const key = await eventStore({ domain: "key" })
      .set({ tokenFn: gcpToken })
      .query({ key: "id", value: id });

    if (!key) throw "Key not found";

    if (!(await compare(secret, key.state.secret))) throw "Incorrect secret";

    return {
      context: {
        key: {
          root: key.state.root,
          service: process.env.SERVICE,
          network: process.env.NETWORK
        },
        node: key.state.node,
        domain: "node"
      }
    };
  }
});
