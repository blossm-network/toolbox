const yaml = require("yaml");
const gateway = require("@blossm/view-gateway");
const eventStore = require("@blossm/event-store-rpc");
const { verify } = require("@blossm/gcp-kms");
const { invalidCredentials } = require("@blossm/errors");
const { download: downloadFile } = require("@blossm/gcp-storage");
const rolePermissions = require("@blossm/role-permissions");
const gcpToken = require("@blossm/gcp-token");

const config = require("./config.json");

let defaultRoles;

module.exports = gateway({
  stores: config.stores,
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
          roles: aggregate.state.roles,
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
    })
});
