import deps from "./deps.js";

export default ({ domain, service = process.env.SERVICE } = {}) => {
  const add = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => ({ eventData, tx: { id: txId, path: txPath, ip: txIp } = {} }) => {
    return deps
      .rpc(domain, service, "event-store")
      .post({
        eventData,
        ...((claims || txId || txPath) && {
          tx: {
            ...(claims && { claims }),
            ...(txPath && { path: txPath }),
            ...(txIp && { ip: txIp }),
            ...(txId && { id: txId }),
          },
        }),
      })
      .in({
        ...(context && { context }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `event-store-${service}-${domain}`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
      });
  };

  const aggregate = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (root, { notFoundThrows } = {}) =>
    deps
      .rpc(domain, service, "event-store")
      .get({ id: root, ...(notFoundThrows != undefined && { notFoundThrows }) })
      .in({
        ...(context && { context }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
      });

  const query = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => ({ key, value }) =>
    deps
      .rpc(domain, service, "event-store")
      .get({ key, value })
      .in({
        ...(context && { context }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
      });
  const aggregateStream = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (fn, { timestamp, updatedOnOrAfter, parallel, root }) =>
    deps
      .rpc(domain, service, "event-store")
      .stream(fn, {
        ...(timestamp && { timestamp }),
        ...(updatedOnOrAfter && { updatedOnOrAfter }),
        ...(parallel && { parallel }),
        ...(root && { root }),
      })
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/stream-aggregates`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
      });

  const rootStream = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (fn, { parallel } = {}) =>
    deps
      .rpc(domain, service, "event-store")
      .stream(fn, { ...(parallel && { parallel }) })
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/roots`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
      });

  const count = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (root) =>
    deps
      .rpc(domain, service, "event-store")
      .get({ id: root })
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/count`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
      });

  const createBlock = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => () =>
    deps
      .rpc(domain, service, "event-store")
      .post()
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/create-block`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `event-store-${service}-${domain}-create-block`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
      });

  return {
    set: ({ context, claims, token, enqueue } = {}) => {
      return {
        add: add({ context, claims, token, enqueue }),
        query: query({ context, claims, token }),
        aggregateStream: aggregateStream({ context, claims, token }),
        rootStream: rootStream({ context, claims, token }),
        count: count({ context, claims, token }),
        aggregate: aggregate({ context, claims, token }),
        createBlock: createBlock({ context, claims, token, enqueue }),
      };
    },
    add: add(),
    aggregate: aggregate(),
    query: query(),
    aggregateStream: aggregateStream(),
    rootStream: rootStream(),
    count: count(),
    createBlock: createBlock(),
  };
};
