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
  mainFn: async (aggregate, { push = true }) => {
    //Must be able to handle this aggregate.
    if (
      !handlers[aggregate.service] ||
      !handlers[aggregate.service][aggregate.domain]
    )
      return;

    const {
      //The query describing which items in the view store will be updated.
      query,
      //The changes to the body of the view.
      update,
    } = handlers[aggregate.service][aggregate.domain]({
      state: aggregate.state,
      root: aggregate.root,
    });

    const aggregateContext =
      aggregate.context && aggregate.context[process.env.CONTEXT];

    //The context that the view should be associated with.
    const contextRoot = aggregateContext
      ? aggregateContext.root
      : aggregate.root;
    const contextDomain = process.env.CONTEXT;
    const contextService = aggregateContext
      ? aggregateContext.service
      : aggregate.service;
    const contextNetwork = aggregateContext
      ? aggregateContext.network
      : aggregate.network;

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

        //Always set the trace and context to make sure the view has an updated trace and the context is set.
        ...(aggregate.trace && { trace: aggregate.trace }),
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
  aggregateStreamFn: ({ timestamp, fn, sortFn }) =>
    Promise.all(
      config.eventStores.map(({ domain, service }) => {
        const { state } = eventStore({ domain, service })
          .set({
            token: { internalFn: gcpToken },
          })
          .streamAggregates(fn, sortFn, { ...(timestamp && { timestamp }) });
      })
    ),
  secretFn: secret,
});
