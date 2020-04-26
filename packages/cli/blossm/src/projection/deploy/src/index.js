const eventHandler = require("@blossm/mongodb-event-handler");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

const config = require("./config.json");

module.exports = eventHandler({
  // Expect the event to be delivered at least once, not necessarily in order.
  mainFn: async (event) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log(" in this: ", { event });
    const {
      [process.env.DOMAIN]: {
        root: domainRoot,
        service: domainService,
        network: domainNetwork,
      } = {},
      root,
      body,
    } = await main(event);
    //TODO
    //eslint-disable-next-line no-console
    console.log(" gottem: ", { root, body });

    const c = await viewStore({
      name: config.name,
      ...(config.domain && { domain: config.domain }),
      ...(config.service && { service: config.service }),
      context: config.context,
    })
      .set({
        context: event.headers.context,
        claims: event.headers.claims,
        tokenFns: { internal: gcpToken },
      })
      .update(root, {
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
      });

    //TODO
    //eslint-disable-next-line no-console
    console.log({
      c: JSON.stringify(c),
      set: {
        context: event.headers.context,
        claims: event.headers.claims,
        tokenFns: { internal: gcpToken },
      },
      update: {
        root,
        a: {
          headers: {
            ...(event.headers.context &&
              event.headers.context[process.env.CONTEXT] && {
                [process.env.CONTEXT]:
                  event.headers.context[process.env.CONTEXT],
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
        },
      },
    });
    // //Should only do this on first delivery.
    // //TODO set token.
    // await command({
    //   name: "push",
    //   domain: "update",
    //   service: "system",
    //   network: process.env.CORE_NETWORK,
    // }).issue(newView);
  },
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
