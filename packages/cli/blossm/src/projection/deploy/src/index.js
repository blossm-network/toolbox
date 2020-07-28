const eventHandler = require("@blossm/event-handler");
const command = require("@blossm/command-rpc");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");
const nodeExternalToken = require("@blossm/node-external-token");
const channelName = require("@blossm/channel-name");
const { get: secret } = require("@blossm/gcp-secret");

const handlers = require("./handlers.js");

const config = require("./config.json");

module.exports = eventHandler({
  mainFn: async (aggregate, { push }) => {
    //Must be able to handle this aggregate.
    if (
      !handlers[aggregate.headers.service] ||
      !handlers[aggregate.headers.service][aggregate.headers.domain]
    )
      return;

    const {
      //The query describing which items in the view store will be updated.
      query,
      //The changes to the body of the view.
      update,
      //The id of the view.
      id,
    } = handlers[aggregate.headers.service][aggregate.headers.domain]({
      state: aggregate.state,
      root: aggregate.headers.root,
    });

    const aggregateContext =
      aggregate.context && aggregate.context[process.env.CONTEXT];

    //The context that the view should be associated with.
    const contextRoot = aggregateContext
      ? aggregateContext.root
      : aggregate.headers.root;
    const contextDomain = process.env.CONTEXT;
    const contextService = aggregateContext
      ? aggregateContext.service
      : aggregate.headers.service;
    const contextNetwork = aggregateContext
      ? aggregateContext.network
      : aggregate.headers.network;

    //TODO
    console.log({ aggregate });
    const { body: newView } = await viewStore({
      name: config.name,
      context: config.context,
    })
      .set({
        token: { internalFn: gcpToken },
        context: {
          [contextDomain]: {
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          },
        },
      })
      .update({
        ...(query && { query }),
        update,
        ...(id && { id }),
        ...(aggregate.txIds && {
          trace: {
            domain: aggregate.headers.domain,
            service: aggregate.headers.service,
            txIds: aggregate.txIds,
          },
        }),
      });

    if (!push) return;

    const channel = channelName({
      name: process.env.NAME,
      context: newView.headers.context,
    });

    await command({
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
  aggregateStreamFn: ({ timestamp, fn, domain, service }) =>
    Promise.all(
      config.events
        .filter((event) =>
          domain && service
            ? event.domain == domain && event.service == service
            : true
        )
        .map(({ domain, service }) =>
          eventStore({ domain, service })
            .set({
              token: { internalFn: gcpToken },
            })
            .aggregateStream(fn, {
              parallel: 100,
              ...(timestamp && { timestamp }),
            })
        )
    ),
  secretFn: secret,
});
