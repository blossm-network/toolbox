const deps = require("./deps");

module.exports = ({ domain, service = process.env.SERVICE } = {}) => {
  const add = ({
    context,
    claims,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
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
        ...(key && { key }),
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
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
  } = {}) => (root) =>
    deps
      .rpc(domain, service, "event-store")
      .get({ id: root })
      .in({
        ...(context && { context }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(key && { key }),
        ...(claims && { claims }),
      });

  const query = ({
    context,
    claims,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key: tokenKey,
    } = {},
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
        ...(tokenKey && { key: tokenKey }),
        ...(claims && { claims }),
      });
  const aggregateStream = ({
    context,
    claims,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
  } = {}) => (fn, { timestamp, parallel }) =>
    deps
      .rpc(domain, service, "event-store")
      .stream(fn, {
        ...(timestamp && { timestamp }),
        ...(parallel && { parallel }),
      })
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/stream-aggregates`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(key && { key }),
        ...(claims && { claims }),
      });

  const rootStream = ({
    context,
    claims,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
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
        ...(key && { key }),
        ...(claims && { claims }),
      });

  const count = ({
    context,
    claims,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
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
        ...(key && { key }),
        ...(claims && { claims }),
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
      };
    },
    add: add(),
    aggregate: aggregate(),
    query: query(),
    aggregateStream: aggregateStream(),
    rootStream: rootStream(),
    count: count(),
  };
};
