const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ domain, service = process.env.SERVICE, network } = {}) => {
  const add = ({ context, claims, tokenFn } = {}) => async events => {
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
        ...(context && { context }),
        ...(network && { network })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  };

  const aggregate = ({ context, claims, tokenFn } = {}) => async root =>
    await deps
      .rpc(domain, service, "event-store")
      .get({ root })
      .in({
        ...(context && { context }),
        ...(network && { network })
      })
      .with({ tokenFn, ...(claims && { claims }) });

  const query = ({ context, claims, tokenFn } = {}) => async ({
    key,
    value
  }) => {
    return await deps
      .rpc(domain, service, "event-store")
      .get({ key, value })
      .in({
        ...(context && { context }),
        ...(network && { network })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  };

  return {
    set: ({ context, claims, tokenFn } = {}) => {
      return {
        add: add({ context, claims, tokenFn }),
        query: query({
          ...(context && { context }),
          ...(claims && { claims }),
          tokenFn
        }),
        aggregate: aggregate({ context, claims, tokenFn })
      };
    },
    add: add(),
    aggregate: aggregate(),
    query: query()
  };
};
