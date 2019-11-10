const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ domain, service, network } = {}) => {
  const add = ({ context, tokenFn } = {}) => async ({
    headers: { root, topic, version, trace, command },
    payload
  }) => {
    const event = {
      ...(context && { context }),
      headers: {
        root,
        topic,
        version,
        created: dateString(),
        ...(trace && { trace }),
        domain,
        service,
        network,
        command: {
          id: command.id,
          action: command.action,
          domain: command.domain,
          service: command.service,
          issued: command.issued
        }
      },
      payload
    };

    await deps
      .operation(domain, "event-store")
      .post(event)
      .in({ ...(context && { context }), service, network })
      .with({ tokenFn });
  };

  const aggregate = ({ context, tokenFn } = {}) => async root =>
    await deps
      .operation(domain, "event-store")
      .get({ root })
      .in({ ...(context && { context }), service, network })
      .with({ tokenFn });

  return {
    set: ({ context, tokenFn } = {}) => {
      return {
        add: add({ context, tokenFn }),
        aggregate: aggregate({ context, tokenFn })
      };
    },
    add: add(),
    aggregate: aggregate()
  };
};
