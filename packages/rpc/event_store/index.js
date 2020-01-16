const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({
  domain,
  service = process.env.SERVICE,
  network = process.env.NETWORK
} = {}) => {
  const add = ({ context, tokenFn } = {}) => async (
    { headers: { root, topic, version, trace, command }, payload },
    { number } = {}
  ) => {
    const event = {
      headers: {
        root,
        topic,
        version,
        created: dateString(),
        ...(context && { context }),
        ...(trace && { trace }),
        ...(command && { command })
      },
      payload
    };

    await deps
      .rpc(domain, "event-store")
      .post({ event, ...(number && { number }) })
      .in({ ...(context && { context }), service, network })
      .with({ tokenFn });
  };

  const aggregate = ({ context, tokenFn } = {}) => async root =>
    await deps
      .rpc(domain, "event-store")
      .get({ root })
      .in({ ...(context && { context }), service, network })
      .with({ tokenFn });

  const query = ({ context, tokenFn } = {}) => async ({ key, value }) => {
    return await deps
      .rpc(domain, "event-store")
      .get({ key, value })
      .in({ ...(context && { context }), service, network })
      .with({ tokenFn });
  };

  return {
    set: ({ context, tokenFn } = {}) => {
      return {
        add: add({ context, tokenFn }),
        query: query({ context, tokenFn }),
        aggregate: aggregate({ context, tokenFn })
      };
    },
    add: add(),
    aggregate: aggregate(),
    query: query()
  };
};
