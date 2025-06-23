import projection from "@blossm/projection";
import projectionRpc from "@blossm/projection-rpc";
import command from "@blossm/command-rpc";
import fact from "@blossm/fact-rpc";
import gcpToken from "@blossm/gcp-token";
import nodeExternalToken from "@blossm/node-external-token";
import viewStore from "@blossm/view-store-rpc";
import eventStore from "@blossm/event-store-rpc";
import channelName from "@blossm/channel-name";
import logger from "@blossm/logger";
import { get as secret } from "@blossm/gcp-secret";
import gcpQueue from "@blossm/gcp-queue";
import composeUpdate from "@blossm/compose-update";

import handlers from "./handlers.js";

import config from "./config.json" with { type: "json" };

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

const saveId = async ({
  aggregate,
  id,
  query,
  update,
  arrayFilters,
  push,
  context,
}) => {
  const updateResponse = await viewStore({
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
      ...(!push && { enqueue: { fn: gcpQueue.enqueue } }),
    })
    .update({
      id,
      update,
      ...(query && { query }),
      ...(arrayFilters && { arrayFilters }),
      ...(aggregate.groups && { groups: aggregate.groups }),
      ...(aggregate.txIds && {
        trace: {
          domain: aggregate.headers.domain,
          service: aggregate.headers.service,
          txIds: aggregate.txIds,
        },
      }),
    });

  if (!push) return;

  // If push is true, body.view and body.keys should exist.
  const { view: newView, keys } = updateResponse.body;

  if (!newView) return;

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

const deleteId = ({ id, query, push, context }) =>
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
      ...(!push && { enqueue: { fn: gcpQueue.enqueue } }),
    })
    .delete(id, {
      query,
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

  let id;

  // Must be synchronous
  for (const r of replay || []) {
    const aggregate = await aggregateFn({
      domain: r.domain,
      service: r.service,
      root: r.root,
      notFoundThrows: false,
    });

    if (!aggregate) {
      logger.warn("PROJECTION REPLAY AGGREGATE NOT FOUND: ", {
        replay,
        update,
        query,
      });
      continue;
    }

    const {
      id: replayId,
      query: replayQuery,
      update: replayUpdate,
      replay: replayReplay,
      ops: replayOps = [],
    } = await handlers[r.service][r.domain]({
      state: aggregate.state,
      id: r.root,
      readFactFn,
      replayFlag: r.flag,
    });

    const {
      fullUpdate: recursiveFullUpdate,
      fullQuery: recursiveFullQuery,
      id: recursiveId,
    } = await replayIfNeeded({
      aggregateFn,
      readFactFn,
      replay: replayReplay,
      update: {
        ...fullUpdate,
        ...replayUpdate,
      },
      query: {
        ...fullQuery,
        ...replayQuery,
      },
    });

    const composedUpdate = composeUpdate(
      replayOps.reduce(
        (result, op) => ({
          ...result,
          ...op.update,
        }),
        recursiveFullUpdate
      ),
      replayOps.reduce(
        (result, op) => ({
          ...result,
          ...op.query,
        }),
        recursiveFullQuery
      ),
      matchDelimiter
    );

    if (recursiveId || replayId) id = recursiveId || replayId;

    fullUpdate = composedUpdate;
    fullQuery = {
      ...fullQuery,
      ...recursiveFullQuery,
    };
  }

  return { fullUpdate, fullQuery, id };
};

//Given a query { obj.id: "some-obj-id", obj.subobj.id: "some-subobj-id"}
//Returns only { obj.id: "some-obj-id" }
const cleanIdQuery = (query) => {
  const newQuery = {};
  for (const key in query) {
    if (
      !key.endsWith(".id") ||
      !Object.keys(query).some(
        (k) =>
          k != key &&
          k.endsWith(".id") &&
          k.startsWith(`${key.split(".")[0]}.`) &&
          k.split(".").length < key.split(".").length
      )
    )
      newQuery[key] = query[key];
  }
  return newQuery;
};

//TODO this should be a package. it's used it lots of places.
const getValue = (object, key) => {
  if (object == undefined) return;
  const keyParts = key.split(".");
  if (keyParts.length <= 1) return object[keyParts[0]];
  return object[keyParts[0]] instanceof Array
    ? object[keyParts[0]].map((element) =>
        getValue(element, keyParts.slice(1).join("."))
      )[0]
    : object[`${keyParts[0]}.${keyParts[1]}`] instanceof Array
    ? object[`${keyParts[0]}.${keyParts[1]}`].map((element) =>
        getValue(element, keyParts.slice(2).join("."))
      )[0]
    : getValue(object[keyParts[0]], keyParts.slice(1).join(".")) ||
      getValue(
        object[`${keyParts[0]}.${keyParts[1]}`],
        keyParts.slice(2).join(".")
      );
};

// prevents queries like
// { some: { id: "some-id"}, some.id: "some-id"}
// also if an update has some: { id: "some-id"} and the query has some.id as a key, it'll remove it from the query.
const cleanQuery = (query, update) => {
  const cleanedQuery = {};
  for (const key in query) {
    if (getValue(update, key) != undefined) continue;
    const split = key.split(".");
    if (split.length < 2 || query[split[0]] == undefined) {
      cleanedQuery[key] = query[key];
    }
  }
  return cleanedQuery;
};

export default projection({
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
      //If arrayFilters should be applied.
      arrayFilters,
      //If the views matching the query should be deleted.
      del,
      //An optional array of operations including `id`'s, `replays`'s, `arrayFilter`'s, query`'s, `del`'s and `update`'s.
      //To be used instad of `query` and `update.
      ops = [],
    } = await handlers[aggregate.headers.service][aggregate.headers.domain]({
      state: aggregate.state,
      id: aggregate.headers.root,
      readFactFn,
      ...(action && { action }),
    });

    const {
      fullQuery,
      fullUpdate,
      id: replayId,
      del: replayDel,
    } = await replayIfNeeded({
      replay,
      aggregateFn,
      readFactFn,
      update,
      query,
    });

    ops.push({
      id: id || replayId,
      query: fullQuery,
      update: fullUpdate,
      arrayFilters,
      del: del || replayDel,
    });

    await Promise.all(
      ops.map(async ({ id, query, update, arrayFilters, del }) => {
        if (!query && !id) return;

        const composedQuery = query && cleanQuery(query, update);

        const composedUpdate = composeUpdate(
          update,
          composedQuery,
          matchDelimiter
        );

        const aggregateContext =
          process.env.CONTEXT &&
          (context ||
            (aggregate.context && aggregate.context[process.env.CONTEXT]));

        if (process.env.CONTEXT && !aggregateContext) return;

        const composedIdQuery = cleanIdQuery(composedQuery);

        if (arrayFilters) arrayFilters.push(query);

        if (id) {
          del
            ? await deleteId({
                context: aggregateContext,
                id,
                push,
              })
            : await saveId({
                aggregate,
                context: aggregateContext,
                id,
                update: composedUpdate,
                push,
              });
        } else if (Object.keys(composedIdQuery).length > 0) {
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
                      context: aggregateContext,
                      id,
                      query: composedIdQuery,
                      push,
                    })
                  : saveId({
                      aggregate,
                      context: aggregateContext,
                      id,
                      query: composedIdQuery,
                      update: composedUpdate,
                      ...(arrayFilters && { arrayFilters }),
                      push,
                    }),
              {
                parallel: 10,
                query: composedIdQuery,
              }
            );
        }
      })
    );
  },
  aggregateFn: async ({ root, domain, service, notFoundThrows = true }) => {
    const { body: aggregate } = await eventStore({ domain, service })
      .set({
        token: { internalFn: gcpToken },
      })
      .aggregate(root, { notFoundThrows });
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
        enqueue: { fn: gcpQueue.enqueue },
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
  mutedEvents: config.muted || [],
});
