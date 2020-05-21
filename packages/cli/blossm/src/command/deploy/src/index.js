const fs = require("fs");
const command = require("@blossm/command");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");
// const gcpTask = require("@blossm/gcp-task");

const main = require("./main.js");
const validate = fs.existsSync("./validate.js") && require("./validate");
const normalize = fs.existsSync("./normalize.js") && require("./normalize");
const fill = fs.existsSync("./fill.js") && require("./fill");

module.exports = command({
  mainFn: main,
  ...(validate && { validateFn: validate }),
  ...(normalize && { normalizeFn: normalize }),
  ...(fill && { fillFn: fill }),
  aggregateFn: ({ context, claims }) => async (
    root,
    {
      domain = process.env.DOMAIN,
      service = process.env.SERVICE,
      network = process.env.NETWORK,
    } = {}
  ) => {
    const { body: aggregate } = await eventStore({ domain, service, network })
      .set({
        context,
        claims,
        tokenFns: { internal: gcpToken },
      })
      .aggregate(root);

    return {
      lastEventNumber: aggregate.headers.lastEventNumber,
      aggregate: aggregate.state,
    };
  },
  addFn: ({ domain, service, context, claims, events }) =>
    eventStore({ domain, service })
      .set({
        context,
        claims,
        tokenFns: { internal: gcpToken },
      })
      .add(events),
  // taskFn: ({ url, body, wait }) =>
  //   gcpTask({
  //     url,
  //     data,
  //     token,
  //     project,
  //     location,
  //     queue,
  //     wait: 0,
  //   }),
});
