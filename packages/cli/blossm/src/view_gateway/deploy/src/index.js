const gateway = require("@blossm/view-gateway");
const eventStore = require("@blossm/event-store-rpc");
const { verify } = require("@blossm/gcp-kms");

const config = require("./config.json");

module.exports = gateway({
  stores: config.stores,
  whitelist: config.whitelist,
  permissionsLookupFn: async ({ principle }) => {
    const aggregate = await eventStore({
      domain: "principle"
    }).aggregate(principle);

    return aggregate ? aggregate.state.permissions : [];
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
