const fs = require("fs");
const path = require("path");
const commandProcedure = require("@blossm/command");
const command = require("@blossm/command-rpc");
const eventStore = require("@blossm/event-store-rpc");
const nodeExternalToken = require("@blossm/node-external-token");
const gcpToken = require("@blossm/gcp-token");
const { enqueue } = require("@blossm/gcp-queue");

const main = require("./main.js");
const validate =
  fs.existsSync(path.resolve(__dirname, "./validate.js")) &&
  require("./validate");
const normalize =
  fs.existsSync(path.resolve(__dirname, "./normalize.js")) &&
  require("./normalize");
const fill =
  fs.existsSync(path.resolve(__dirname, "./fill.js")) && require("./fill");

module.exports = commandProcedure({
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
  commandFn: ({ path, idempotency, context, claims, token, trace }) => ({
    name,
    domain,
    service,
    network,
    payload,
    root,
    options,
    context: contextOverride = context,
    claims: claimsOverride = claims,
    async = false,
    wait = 0,
    principal = "user",
  }) =>
    command({
      name,
      domain,
      ...(service && { service }),
      ...(network && { network }),
    })
      .set({
        ...(contextOverride && { context: contextOverride }),
        ...(claimsOverride && { claims: claimsOverride }),
        ...(token && { currentToken: token }),
        token: {
          internalFn: gcpToken,
          externalFn: ({ network, key } = {}) =>
            principal == "user"
              ? { token, type: "Bearer" }
              : nodeExternalToken({ network, key }),
        },
        ...(async && { enqueue: { fn: enqueue, wait } }),
      })
      .issue(payload, {
        ...(root && { root }),
        ...(options && { options }),
        headers: { trace, idempotency, path },
      }),
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
