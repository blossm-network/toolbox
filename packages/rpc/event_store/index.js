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
  } = {}) => ({
    eventData,
    scenario: { trace: scenarioTrace, path: scenarioPath } = {},
  }) => {
    return deps
      .rpc(domain, service, "event-store")
      .post({
        eventData,
        ...((claims || scenarioTrace || scenarioPath) && {
          scenario: {
            ...(claims && { claims }),
            ...(scenarioPath && { path: scenarioPath }),
            ...(scenarioTrace && { trace: scenarioTrace }),
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
  const stream = ({
    context,
    claims,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
  } = {}) => (fn, { root, from, parallel }) =>
    deps
      .rpc(domain, service, "event-store")
      .stream(fn, { id: root, from, ...(parallel && { parallel }) })
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/stream`,
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

  const updateProof = ({
    context,
    claims,
    token: { internalFn: internalTokenFn } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => (id) =>
    deps
      .rpc(domain, service, "event-store")
      .put(id)
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/proof`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(claims && { claims }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `event-store-${service}-${domain}-proofs`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
      });

  return {
    set: ({ context, claims, token, enqueue } = {}) => {
      return {
        add: add({ context, claims, token, enqueue }),
        query: query({ context, claims, token }),
        stream: stream({ context, claims, token }),
        rootStream: rootStream({ context, claims, token }),
        count: count({ context, claims, token }),
        aggregate: aggregate({ context, claims, token }),
        updateProof: updateProof({ context, claims, token, enqueue }),
      };
    },
    add: add(),
    aggregate: aggregate(),
    query: query(),
    stream: stream(),
    rootStream: rootStream(),
    count: count(),
    updateProof: updateProof(),
  };
};
