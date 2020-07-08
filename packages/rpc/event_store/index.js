const { string: dateString } = require("@blossm/datetime");

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
  } = {}) => (events) => {
    const normalizedEvents = events.map((event) => {
      return {
        data: {
          root: event.data.root,
          headers: {
            ...event.data.headers,
            created: dateString(),
            ...((context || event.data.headers.context) && {
              context: {
                ...event.data.headers.context,
                ...context,
              },
            }),
            ...(claims && { claims }),
          },
          payload: event.data.payload,
        },
        ...(event.number && { number: event.number }),
      };
    });

    return deps
      .rpc(domain, service, "event-store")
      .post({ events: normalizedEvents })
      .in({
        ...(context && { context }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(key && { key }),
        ...(claims && { claims }),
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
  } = {}) => (id) => {
    return deps
      .rpc(domain, service, "event-store")
      .put(id)
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/proof`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(claims && { claims }),
      });
  };

  return {
    set: ({ context, claims, token } = {}) => {
      return {
        add: add({ context, claims, token }),
        query: query({ context, claims, token }),
        stream: stream({ context, claims, token }),
        rootStream: rootStream({ context, claims, token }),
        count: count({ context, claims, token }),
        aggregate: aggregate({ context, claims, token }),
        updateProof: updateProof({ context, claims, token }),
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
