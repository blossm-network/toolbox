const gateway = require("@blossm/command-gateway");
const viewStore = require("@blossm/view-store-rpc");
const { verify } = require("@blossm/gcp-kms");

const config = require("./config.json");

module.exports = gateway({
  commands: config.commands,
  whitelist: config.whitelist,
  permissionsLookupFn: async ({ principle }) => {
    const { permissions } = (
      await viewStore({
        name: "permissions",
        domain: "principle"
      })
    ).read({ principle });

    //eslint-disable-next-line
    console.log("permissions: ", persmissions);
    return permissions || [];
  },
  verifyFn: verify({
    ring: process.env.SERVICE,
    key: "challenge",
    location: "global",
    version: "1",
    project: process.env.GCP_PROJECT
  })
});
