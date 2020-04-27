const eventHandler = require("@blossm/mongodb-event-handler");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

const config = require("./config.json");

module.exports = eventHandler({
  mainFn: (state, event) => {
    const {
      [process.env.DOMAIN]: {
        root: domainRoot,
        service: domainService,
        network: domainNetwork,
      } = {},
      body,
    } = main(state, event);

    //TODO
    //eslint-disable-next-line no-console
    console.log({ body });

    return {
      root: event.headers.root,
      headers: {
        ...(event.headers.context &&
          event.headers.context[process.env.CONTEXT] && {
            [process.env.CONTEXT]: event.headers.context[process.env.CONTEXT],
          }),
        ...(process.env.DOMAIN &&
          domainRoot &&
          domainService &&
          domainNetwork && {
            [process.env.DOMAIN]: {
              root: domainRoot,
              service: domainService,
              network: domainNetwork,
            },
          }),
      },
      body: {
        ...body,
        ...(event.headers.trace && { trace: event.headers.trace }),
      },
    };
  },
  commitFn: async (state) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ state });

    await viewStore({
      name: config.name,
      ...(config.domain && { domain: config.domain }),
      ...(config.service && { service: config.service }),
      context: config.context,
    })
      .set({
        tokenFns: { internal: gcpToken },
      })
      .update(state.root, {
        headers: state.headers,
        body: state.body,
      });
  },
  // //Should only do this on first delivery.
  // //TODO set token.
  // await command({
  //   name: "push",
  //   domain: "update",
  //   service: "system",
  //   network: process.env.CORE_NETWORK,
  // }).issue(newView);
  streamFn: ({ root, from }, fn) =>
    eventStore({
      domain: process.env.EVENT_DOMAIN,
      service: process.env.EVENT_SERVICE,
    })
      .set({
        tokenFns: { internal: gcpToken },
      })
      .stream({ root, from }, fn),
});
