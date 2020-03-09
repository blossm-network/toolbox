const fs = require("fs");
const commandHandler = require("@blossm/command-handler");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");
const validate = fs.existsSync("./validate.js") && require("./validate");
const normalize = fs.existsSync("./normalize.js") && require("./normalize");
const fill = fs.existsSync("./fill.js") && require("./fill");

module.exports = commandHandler({
  mainFn: main,
  ...(validate && { validateFn: validate }),
  ...(normalize && { normalizeFn: normalize }),
  ...(fill && { fillFn: fill }),
  aggregateFn: ({ context, session }) => async (
    root,
    {
      domain = process.env.DOMAIN,
      service = process.env.SERVICE,
      network = process.env.NETWORK
    } = {}
  ) => {
    const aggregate = await eventStore({ domain, service, network })
      .set({
        context,
        session,
        tokenFn: gcpToken
      })
      .aggregate(root);

    return {
      lastEventNumber: aggregate.headers.lastEventNumber,
      aggregate: aggregate.state
    };
  },
  addFn: async ({ domain, context, session, events }) =>
    eventStore({ domain })
      .set({
        context,
        session,
        tokenFn: gcpToken
      })
      .add(events)
});
