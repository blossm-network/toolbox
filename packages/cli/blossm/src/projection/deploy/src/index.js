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

const saveId = async ({ aggregate, id, update, push, context }) => {
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

const formatUpdate = (update) => {
  const result = {};
  for (const key in update) {
    const components = key.split(".$.");
    if (components.length < 2 || update[components[0]] == undefined) {
      result[key] = {
        ...result[key],
        ...update[key],
      };
      continue;
    }
    result[components[0]] = {
      ...result[components[0]],
      [components[1]]: update[key],
    };
  }

  return result;
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

    if (replay && replay.length != 0) {
      await Promise.all(
        replay.map(async (r) => {
          try {
            const aggregate = await aggregateFn({
              domain: r.domain,
              service: r.service,
              root: r.root,
            });

            const { query: replayQuery, update: replayUpdate } = handlers[
              r.service
            ][r.domain]({
              state: aggregate.state,
              id: r.root,
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
          } catch (_) {
            return;
          }
        })
      );
    }

    if (!query && !id) return;

    const aggregateContext =
      process.env.CONTEXT &&
      (context ||
        (aggregate.context && aggregate.context[process.env.CONTEXT]));

    const formattedUpdate = formatUpdate(update);

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
              update: formattedUpdated,
              push,
            }),
          {
            parallel: 100,
            ...(query && { query }),
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
