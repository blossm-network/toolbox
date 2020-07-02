const eventHandler = require("@blossm/mongodb-event-handler");
const { get: secret } = require("@blossm/gcp-secret");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

module.exports = eventHandler({
  mainFn: main,
  streamFn: ({ root, from }, fn) =>
    eventStore({
      domain: process.env.STORE_DOMAIN,
      service: process.env.STORE_SERVICE,
    })
      .set({
        token: { internalFn: gcpToken },
      })
      .stream(fn, { root, from }),
  secretFn: secret,
});
