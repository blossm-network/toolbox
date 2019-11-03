const gateway = require("@sustainers/auth-gateway");
const { verify } = require("@sustainers/gcp-kms");

const priviledges = require("./priviledges.js");
const scopes = require("./scopes.js");

const config = require("./config.json");

module.exports = gateway({
  whitelist: config.whitelist,
  scopesLookupFn: scopes,
  priviledgesLookupFn: priviledges,
  verifyFn: verify({
    ring: process.env.SERVICE,
    key: "challenge",
    location: "global",
    version: "1",
    project: process.env.GCP_PROJECT
  })
});
