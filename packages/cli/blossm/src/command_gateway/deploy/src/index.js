const gateway = require("@blossm/command-gateway");
const viewStore = require("@blossm/view-store-rpc");
const { verify } = require("@blossm/gcp-kms");

const config = require("./config.json");

module.exports = gateway({
  commands: config.commands,
  whitelist: config.whitelist,
  permissionsLookupFn: async ({ principle }) => {
    const { permissions } = await viewStore({
      name: "permissions",
      domain: "principle"
    }).read({ root: principle });

    //eslint-disable-next-line
    console.log("yung permissions: ", { principle, permissions });
    return permissions || [];
  },
  verifyFn: verify({
    ring: process.env.SERVICE,
    key: "auth",
    location: "global",
    version: "1",
    project: process.env.GCP_PROJECT
  })
});
