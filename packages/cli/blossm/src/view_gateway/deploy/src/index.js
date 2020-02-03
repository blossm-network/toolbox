const gateway = require("@blossm/view-gateway");
const eventStore = require("@blossm/event-store-rpc");
const { verify } = require("@blossm/gcp-kms");
const { invalidCredentials } = require("@blossm/errors");
const gcpToken = require("@blossm/gcp-token");

const config = require("./config.json");

module.exports = gateway({
  stores: config.stores,
  whitelist: config.whitelist,
  permissionsLookupFn: async ({ principle }) => {
    const aggregate = await eventStore({
      domain: "principle"
    })
      .set({ tokenFn: gcpToken })
      .aggregate(principle);

    return aggregate ? aggregate.state.permissions : [];
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
      ring: process.env.SERVICE,
      key,
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    })
});
