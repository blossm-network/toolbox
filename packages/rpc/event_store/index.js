const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ domain, service, network } = {}) => {
  const add = ({ context, session, tokenFn } = {}) => async (
    {
      headers: {
        root,
        action: eventAction,
        domain: eventDomain,
        service: eventService,
        topic,
        version,
        trace,
        command
      },
      payload
    },
    { number } = {}
  ) => {
    const event = {
      headers: {
        root,
        topic,
        action: eventAction,
        domain: eventDomain,
        service: eventService,
        version,
        created: dateString(),
        ...(context && { context }),
        ...(session && { session }),
        ...(trace && { trace }),
        ...(command && { command })
      },
      payload
    };

    await deps
      .rpc(domain, "event-store")
      .post({ event, ...(number && { number }) })
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
