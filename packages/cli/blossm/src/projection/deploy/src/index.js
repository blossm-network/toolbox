const projection = require("@blossm/projection");
const projectionRpc = require("@blossm/projection-rpc");
const command = require("@blossm/command-rpc");
const fact = require("@blossm/fact-rpc");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");
const nodeExternalToken = require("@blossm/node-external-token");
const channelName = require("@blossm/channel-name");
const { get: secret } = require("@blossm/gcp-secret");
const { enqueue } = require("@blossm/gcp-queue");

const handlers = require("./handlers.js");

const config = require("./config.json");

module.exports = projection({
  mainFn: async ({ aggregate, action, push, aggregateFn, readFactFn }) => {
    //Must be able to handle this aggregate.
    if (
      !handlers[aggregate.headers.service] ||
      !handlers[aggregate.headers.service][aggregate.headers.domain]
    )
      return;

    let {
      //The query describing which items in the view store will be updated.
      query,
      //The changes to the body of the view.
      update,
      //The id of the view.
      id,
      //Events that need to be replayed.
      replay,
      //If a new view should be created if nothing matches the query. Defaults to true if an id is returned.
      upsert,
    } = await handlers[aggregate.headers.service][aggregate.headers.domain]({
      state: aggregate.state,
      root: aggregate.headers.root,
      readFactFn,
      ...(action && { action }),
    });

    if (replay && replay.length != 0) {
      await Promise.all(
        replay
          // .filter(
          //   (r) => !replayedRoots.includes(`${r.root}-${r.domain}-${r.service}`)
          // )
          .map(async (r) => {
            // const rId = `${r.root}-${r.domain}-${r.service}`;
            // replayedRoots.push(rId);
            const { state } =
              // replayedStates[rId] ||
              await aggregateFn({
                domain: r.domain,
                service: r.service,
                root: r.root,
              });

            // replayedStates[rId] = { state };

            const { query: replayQuery, update: replayUpdate } = handlers[
              r.service
            ][r.domain]({
              state,
              root: r.root,
              readFactFn,
            });
            update = {
              ...update,
              ...replayUpdate,
            };
            query = {
              ...query,
              ...replayQuery,
            };
          })
      );
    }

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
        ...(!push && { enqueue: { fn: enqueue } }),
      })
      .update({
        ...(query && { query }),
        update,
        ...(id && { id }),
        ...(upsert && { upsert }),
        ...(aggregate.txIds && {
          trace: {
            domain: aggregate.headers.domain,
            service: aggregate.headers.service,
            txIds: aggregate.txIds,
          },
        }),
      });

    if (!newView || !push) return;

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
  aggregateFn: async ({ root, domain, service }) => {
    const { body: aggregate } = await eventStore({ domain, service })
      .set({
        token: { internalFn: gcpToken },
      })
      .aggregate(root);
    return aggregate;
  },
  readFactFn: async ({ name, domain, service, network, query, id }) => {
    const { body } = await fact({
      name,
      ...(domain && { domain }),
      service,
      ...(network && { network }),
    })
      .set({
        token: {
          internalFn: gcpToken,
        },
      })
      .read({ query, ...(id && { id }) });
    return body;
  },
  playFn: ({ root, domain, service }) => {
    projectionRpc({
      name: config.name,
      context: config.context,
    })
      .set({
        token: { internalFn: gcpToken },
        enqueue: { fn: enqueue },
      })
      .play({ root, domain, service });
  },
  rootStreamFn: ({ fn, domain, service }) =>
    eventStore({ domain, service })
      .set({
        token: { internalFn: gcpToken },
      })
      .rootStream(fn, {
        parallel: 100,
      }),
  replayStores: config.replay || config.events,
  secretFn: secret,
});
