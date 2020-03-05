const eventHandler = require("@blossm/event-handler");
const viewStore = require("@blossm/view-store-rpc");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

const config = require("./config.json");

module.exports = eventHandler({
  mainFn: async event => {
    return await viewStore({
      name: config.name,
      domain: config.domain
    })
      .set({
        context: event.headers.context,
        session: event.headers.session,
        tokenFn: gcpToken
      })
      .create({
        root: event.headers.root,
        ...(event.headers.trace && { trace: event.headers.trace }),
        ...(await main(event))
      });
  }
});
