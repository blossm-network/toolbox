const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ domain, service, network } = {}) => {
  const add = ({ context, session, tokenFn } = {}) => async events => {
    const normalizedEvents = events.map(event => {
      return {
        data: {
          headers: {
            ...event.data.headers,
            created: dateString(),
            ...(context && { context }),
            ...(session && { session })
          },
          payload: event.data.payload
        },
        ...(event.number && { number: event.number })
      };
    });

    await deps
      .rpc(domain, "event-store")
      .post({ events: normalizedEvents })
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  };

  const aggregate = ({ context, session, tokenFn } = {}) => async root =>
    await deps
      .rpc(domain, "event-store")
      .get({ root })
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });

  const query = ({ context, session, tokenFn } = {}) => async ({
    key,
    value
  }) => {
    return await deps
      .rpc(domain, "event-store")
      .get({ key, value })
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  };

  return {
    set: ({ context, session, tokenFn } = {}) => {
      return {
        add: add({ context, session, tokenFn }),
        query: query({
          ...(context && { context }),
          ...(session && { session }),
          tokenFn
        }),
        aggregate: aggregate({ context, session, tokenFn })
      };
    },
    add: add(),
    aggregate: aggregate(),
    query: query()
  };
};
