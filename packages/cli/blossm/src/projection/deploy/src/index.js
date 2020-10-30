const projection = require("@blossm/projection");
const projectionRpc = require("@blossm/projection-rpc");
const command = require("@blossm/command-rpc");
const fact = require("@blossm/fact-rpc");
const gcpToken = require("@blossm/gcp-token");
const nodeExternalToken = require("@blossm/node-external-token");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const channelName = require("@blossm/channel-name");
const logger = require("@blossm/logger");
const { get: secret } = require("@blossm/gcp-secret");
const { enqueue } = require("@blossm/gcp-queue");
const composeUpdate = require("@blossm/compose-update");

const handlers = require("./handlers.js");

const config = require("./config.json");

const matchDelimiter = ".$.";

const pushToChannel = async ({ channel, view, id, trace, type }) => {
  try {
    await command({
      name: "push",
      domain: "updates",
      service: "base",
      network: process.env.BASE_NETWORK,
    })
      .set({
        token: {
          externalFn: nodeExternalToken,
          internalFn: gcpToken,
          key: "access",
        },
      })
      .issue({
        ...(view && { view }),
        ...(trace && { trace }),
        id,
        type,
        channel,
      });
  } catch (err) {
    logger.error("Failed to push updates.", { err });
  }
};

const pushToChannels = async ({
  context,
  groups,
  keys,
  view,
  id,
  trace,
  type,
}) => {
  if (context) {
    //Run once if there are no keys
    for (const key of keys || [null]) {
      const channel = channelName({
        name: process.env.NAME,
        context,
        ...(key && { key }),
      });

      await pushToChannel({
        channel,
        ...(view && { view }),
        id,
        ...(trace && { trace }),
        type,
      });
    }
  }

  //Const get all principals
  await Promise.all(
    (groups || []).map((group) =>
      fact({
        name: "principals",
        domain: "group",
        service: "base",
        network: process.env.BASE_NETWORK,
      })
        .set({
          token: {
            externalFn: nodeExternalToken,
            internalFn: gcpToken,
            key: "access",
          },
        })
        .stream(
          async (principal) => {
            for (const key of keys || [null]) {
              const channel = channelName({
                name: process.env.NAME,
                ...(context && {
                  context,
                }),
                principal,
                ...(key && { key }),
              });

              //If there is no context, the channel is always the principal's channel.
              await pushToChannel({
                channel,
                ...(view && { view }),
                id,
                ...(trace && { trace }),
                type,
              });
            }
          },
          {
            root: group.root,
            query: {
              parallel: 100,
            },
          }
        )
    )
  );
};

const saveId = async ({ aggregate, id, query, update, push, context }) => {
  const {
    body: { view: newView, keys },
  } = await viewStore({
    name: config.name,
    context: config.context,
  })
    .set({
      token: { internalFn: gcpToken },
      ...(context && {
        context: {
          [process.env.CONTEXT]: {
            root: context.root,
            service: context.service,
            network: context.network,
          },
        },
      }),
      ...(!push && { enqueue: { fn: enqueue } }),
    })
    .update({
      id,
      update,
      ...(query && { query }),
      ...(aggregate.groups && { groups: aggregate.groups }),
      ...(aggregate.txIds && {
        trace: {
          domain: aggregate.headers.domain,
          service: aggregate.headers.service,
          txIds: aggregate.txIds,
        },
      }),
    });

  if (!newView || !push) return;

  await pushToChannels({
    ...(newView.headers.context && { context: newView.headers.context }),
    ...(newView.headers.groups && { groups: newView.headers.groups }),
    view: newView,
    keys,
    id: newView.headers.id,
    trace: newView.trace,
    type:
      newView.headers.created == newView.headers.modified ? "create" : "update",
  });
};

const deleteId = ({ aggregate, id, query, push, context }) =>
  viewStore({
    name: config.name,
    context: config.context,
  })
    .set({
      token: { internalFn: gcpToken },
      ...(context && {
        context: {
          [process.env.CONTEXT]: {
            root: context.root,
            service: context.service,
            network: context.network,
          },
        },
      }),
      ...(!push && { enqueue: { fn: enqueue } }),
    })
    .delete(id, {
      ...(query && { query }),
      ...(aggregate.groups && { groups: aggregate.groups }),
    });

const replayIfNeeded = async ({
  replay,
  aggregateFn,
  readFactFn,
  update,
  query,
}) => {
  let fullUpdate = {
    ...update,
  };
  let fullQuery = {
    ...query,
  };
  if (replay && replay.length != 0) {
    await Promise.all(
      replay.map(async (r) => {
        try {
          const aggregate = await aggregateFn({
            domain: r.domain,
            service: r.service,
            root: r.root,
          });

          const {
            query: replayQuery,
            update: replayUpdate,
            replay: replayReplay,
          } = await handlers[r.service][r.domain]({
            state: aggregate.state,
            id: r.root,
            readFactFn,
          });

          const {
            fullUpdate: recursiveFullUpdate,
            fullQuery: recursiveFullQuery,
          } = await replayIfNeeded({
            aggregateFn,
            readFactFn,
            replay: replayReplay,
            update: replayUpdate,
            query: replayQuery,
          });

          //TODO
          console.log({
            recursiveFullUpdate: JSON.stringify(recursiveFullUpdate),
            recursiveFullQuery: JSON.stringify(recursiveFullQuery),
          });

          const composedRecursiveFullUpdate = composeUpdate(
            recursiveFullUpdate,
            recursiveFullQuery,
            matchDelimiter
          );

          //TODO
          console.log({
            composedRecursiveFullUpdate: JSON.stringify(
              composedRecursiveFullUpdate
            ),
          });

          //Supports multi-item array replays
          for (const key in composedRecursiveFullUpdate) {
            if (
              composedRecursiveFullUpdate[key] instanceof Array &&
              fullUpdate[key] instanceof Array
            ) {
              composedRecursiveFullUpdate[key] = [
                ...fullUpdate[key],
                ...composedRecursiveFullUpdate[key],
              ];
            }
          }

          //TODO
          console.log({
            composedRecursiveFullUpdate2: JSON.stringify(
              composedRecursiveFullUpdate
            ),
          });

          fullUpdate = {
            ...fullUpdate,
            ...composedRecursiveFullUpdate,
          };
          fullQuery = {
            ...fullQuery,
            ...recursiveFullQuery,
          };
        } catch (_) {
          return;
        }
      })
    );
  }

  return { fullUpdate, fullQuery };
};

// prevents queries like
// { some: { id: "some-id"}, some.id: "some-id"}
const cleanQuery = (query) => {
  const cleanedQuery = {};
  for (const key in query) {
    const split = key.split(".");
    if (split.length < 2 || query[split[0]] == undefined) {
      cleanedQuery[key] = query[key];
    }
  }
  return cleanedQuery;
};

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
      //A context to be added to the view.
      context,
      //If the views matching the query should be deleted.
      del,
    } = await handlers[aggregate.headers.service][aggregate.headers.domain]({
      state: aggregate.state,
      id: aggregate.headers.root,
      readFactFn,
      ...(action && { action }),
    });

    const { fullQuery, fullUpdate } = await replayIfNeeded({
      replay,
      aggregateFn,
      readFactFn,
      update,
      query,
    });

    //TODO
    console.log({
      fullUpdate: JSON.stringify(fullUpdate),
      fullQuery: JSON.stringify(fullQuery),
    });
    const composedQuery = fullQuery && cleanQuery(fullQuery);

    const composedUpdate = composeUpdate(
      fullUpdate,
      composedQuery,
      matchDelimiter
    );

    if (!fullQuery && !id) return;

    const aggregateContext =
      process.env.CONTEXT &&
      (context ||
        (aggregate.context && aggregate.context[process.env.CONTEXT]));

    if (id) {
      del
        ? await deleteId({
            aggregate,
            context: aggregateContext,
            id,
            update: composedUpdate,
            push,
          })
        : await saveId({
            aggregate,
            context: aggregateContext,
            id,
            update: composedUpdate,
            push,
          });
    } else {
      await viewStore({
        name: config.name,
        context: config.context,
      })
        .set({
          token: { internalFn: gcpToken },
          ...(aggregateContext && {
            context: {
              [process.env.CONTEXT]: {
                root: aggregateContext.root,
                service: aggregateContext.service,
                network: aggregateContext.network,
              },
            },
          }),
        })
        .idStream(
          ({ id }) =>
            del
              ? deleteId({
                  aggregate,
                  context: aggregateContext,
                  id,
                  query: composedQuery,
                  update: composedUpdate,
                  push,
                })
              : saveId({
                  aggregate,
                  context: aggregateContext,
                  id,
                  query: composedQuery,
                  update: composedUpdate,
                  push,
                }),
          {
            parallel: 100,
            ...(composedQuery && { query: composedQuery }),
          }
        );
    }
  },
  aggregateFn: async ({ root, domain, service }) => {
    const { body: aggregate } = await eventStore({ domain, service })
      .set({
        token: { internalFn: gcpToken },
      })
      .aggregate(root);
    return aggregate;
  },
  readFactFn: async ({ name, domain, service, network, query, root }) => {
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
      .read({ query, ...(root && { root }) });
    return body;
  },
  playFn: ({ root, domain, service }) =>
    projectionRpc({
      name: config.name,
      context: config.context,
    })
      .set({
        token: { internalFn: gcpToken },
        enqueue: { fn: enqueue },
      })
      .play({ root, domain, service }),
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
