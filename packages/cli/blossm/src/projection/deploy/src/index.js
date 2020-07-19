const eventHandler = require("@blossm/mongodb-event-handler");
const command = require("@blossm/command-rpc");
const viewStore = require("@blossm/view-store-rpc");
const eventStores = require("@blossm/event-stores-rpc");
const gcpToken = require("@blossm/gcp-token");
const nodeExternalToken = require("@blossm/node-external-token");
const channelName = require("@blossm/channel-name");
const { get: secret } = require("@blossm/gcp-secret");

const handlers = require("./handlers.js");

const config = require("./config.json");

module.exports = eventHandler({
  mainFn: async (event) => {
    //TODO
    console.log({ event });
    //Must be able to handle this event.
    if (
      !handlers[event.data.headers.service] ||
      !handlers[event.data.headers.service][event.data.headers.domain] ||
      !handlers[event.data.headers.service][event.data.headers.domain][
        event.data.headers.action
      ]
    )
      return;

    const {
      //The query describing which items in the view store will be updated.
      query,
      //The changes to the body of the view.
      body,
    } = handlers[event.data.headers.service][event.data.headers.domain][
      event.data.headers.action
    ]({
      payload: event.data.payload,
      root: event.data.root,
    });

    //TODO
    console.log({ query, body, headers: event.data.headers });

    //Always set the headers to make sure the view has an updated trace and the context is set.
    const headers = {
      ...(event.data.headers.trace && { trace: event.data.headers.trace }),
      ...(event.data.headers.context &&
        event.data.headers.context[process.env.CONTEXT] && {
          context: {
            root: event.data.headers.context[process.env.CONTEXT].root,
            domain: process.env.CONTEXT,
            service: event.data.headers.context[process.env.CONTEXT].service,
            network: event.data.headers.context[process.env.CONTEXT].network,
          },
        }),
    };

    //TODO
    console.log({ headers });
    const { body: newView } = await viewStore({
      name: config.name,
      context: config.context,
    })
      .set({
        token: { internalFn: gcpToken },
      })
      .update({
        ...(query && { query }),
        update: {
          body,
          headers,
        },
      });

    const channel = channelName({
      name: process.env.NAME,
      context: newView.headers.context,
    });

    command({
      name: "push",
      domain: "updates",
      service: "system",
      network: process.env.CORE_NETWORK,
    })
      .set({
        token: {
          externalFn: nodeExternalToken,
          internalFn: gcpToken,
          key: "access",
        },
      })
      .issue({
        view: newView,
        channel,
      });
  },
  streamFn: ({ from, fn, sortFn }) =>
    eventStores(
      config.stores.map(({ domain, service, actions }) => {
        return {
          operation: [domain, service, "event-store"],
          query: {
            from,
            actions,
            parallel: 1,
          },
        };
      })
    )
      .set({
        token: { internalFn: gcpToken },
      })
      .stream(fn, sortFn),

  secretFn: secret,
});
