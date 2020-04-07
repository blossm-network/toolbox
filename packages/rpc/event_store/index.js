const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ domain, service = process.env.SERVICE } = {}) => {
  const add = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async events => {
    const normalizedEvents = events.map(event => {
      return {
        data: {
          headers: {
            ...event.data.headers,
            created: dateString(),
            ...(context && { context }),
            ...(claims && { claims })
          },
          payload: event.data.payload
        },
        ...(event.number && { number: event.number })
      };
    });

    await deps
      .rpc(domain, service, "event-store")
      .post({ events: normalizedEvents })
      .in({
        ...(context && { context })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  };

  const aggregate = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async root =>
    await deps
      .rpc(domain, service, "event-store")
      .get({ root })
      .in({
        ...(context && { context })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });

  const query = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async ({ key, value }) => {
    return await deps
      .rpc(domain, service, "event-store")
      .get({ key, value })
      .in({
        ...(context && { context })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  };

  return {
    set: ({ context, claims, tokenFns } = {}) => {
      return {
        add: add({ context, claims, tokenFns }),
        query: query({ context, claims, tokenFns }),
        aggregate: aggregate({ context, claims, tokenFns })
      };
    },
    add: add(),
    aggregate: aggregate(),
    query: query()
  };
};
