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
        command: {
          id: command.id,
          action: command.action,
          domain: command.domain,
          service: command.service,
          network: command.network,
          issued: command.issued
        }
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

  const query = ({ context, tokenFn } = {}) => async query =>
    await deps
      .rpc(domain, "event-store")
      .get(query)
      .in({ ...(context && { context }), service, network })
      .with({ tokenFn });

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
