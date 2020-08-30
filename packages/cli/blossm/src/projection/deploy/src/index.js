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

const handlers = require("./handlers.js");

const config = require("./config.json");

const pushToChannel = async ({ channel, newView }) => {
  try {
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
  } catch (err) {
    logger.error("Failed to push updates.", { err });
  }
};

const saveId = async ({ aggregate, id, query, update, push, context }) => {
  const { body: newView } = await viewStore({
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

  if (newView.headers.context) {
    const channel = channelName({
      name: process.env.NAME,
      ...(newView.headers.context && {
        context: newView.headers.context,
      }),
    });

    await pushToChannel({ channel, newView });
  }

  //Const get all principals
  await Promise.all(
    (newView.headers.groups || []).map((group) =>
      fact({
        name: "principals",
        domain: "group",
        service: "core",
        network: process.env.CORE_NETWORK,
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
            const channel = channelName({
              name: process.env.NAME,
              ...(newView.headers.context && {
                context: newView.headers.context,
              }),
              principal,
            });

            //If there is no context, the channel is always the principal's channel.
            await pushToChannel({ channel, newView });
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

const formatUpdate = (update, query) => {
  const result = {};

  const matchUpdates = [];

  const matchDelimiter = ".$.";

  for (const key in update) {
    const components = key.split(matchDelimiter);
    if (components.length > 1) {
      matchUpdates.push({
        root: components[0],
        key: components[1],
        value: update[key],
      });
    } else {
      result[key] = update[key];
    }
  }

  if (matchUpdates.length == 0) return result;

  for (const matchUpdate of matchUpdates) {
    let relevantQueryParams = [];
    for (const queryKey in query) {
      const querySplit = queryKey.split(`${matchUpdate.root}.`);
      if (querySplit.length > 1) {
        relevantQueryParams.push({
          key: querySplit[1],
          value: query[queryKey],
        });
      }
    }

    if (result[matchUpdate.root] instanceof Array) {
      result[matchUpdate.root] = result[matchUpdate.root].map((element) => {
        for (const param of relevantQueryParams)
          if (element[param.key] != param.value) return element;

        return {
          ...element,
          [matchUpdate.key]: matchUpdate.value,
        };
      });
    } else {
      result[`${matchUpdate.root}${matchDelimiter}${matchUpdate.key}`] =
        matchUpdate.value;
    }
  }

  return result;
};

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
          } = handlers[r.service][r.domain]({
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

          fullUpdate = {
            ...fullUpdate,
            ...recursiveFullUpdate,
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

    if (!fullQuery && !id) return;

    const aggregateContext = process.env.CONTEXT && {
      ...(aggregate.context && aggregate.context[process.env.CONTEXT]),
      ...context,
    };

    const formattedUpdate = formatUpdate(fullUpdate, fullQuery);

    if (id) {
      await saveId({
        aggregate,
        context: aggregateContext,
        id,
        update: formattedUpdate,
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
            saveId({
              aggregate,
              aggregateContext,
              id,
              //Pass query here so that match `.$.` queries will work.
              query: fullQuery,
              update: formattedUpdate,
              push,
            }),
          {
            parallel: 100,
            ...(fullQuery && { query: fullQuery }),
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
