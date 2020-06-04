const fs = require("fs");
const path = require("path");
const command = require("@blossm/command");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");
// const gcpTask = require("@blossm/gcp-task");

const main = require("./main.js");
const validate =
  fs.existsSync(path.resolve(__dirname, "./validate.js")) &&
  require("./validate");
const normalize =
  fs.existsSync(path.resolve(__dirname, "./normalize.js")) &&
  require("./normalize");
const fill =
  fs.existsSync(path.resolve(__dirname, "./fill.js")) && require("./fill");

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
        ...(context && { context }),
        ...(claims && { claims }),
        token: { internalFn: gcpToken },
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
        ...(context && { context }),
        ...(claims && { claims }),
        token: { internalFn: gcpToken },
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
