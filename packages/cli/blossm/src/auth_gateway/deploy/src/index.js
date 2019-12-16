const gateway = require("@blossm/auth-gateway");
const { verify } = require("@blossm/gcp-kms");

const priviledges = require("./priviledges.js.js.js");
const scopes = require("./scopes.js.js.js");

const config = require("./config.json.js.js");

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
