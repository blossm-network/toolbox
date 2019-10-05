const { string: dateString } = require("@sustainers/datetime");

const deps = require("./deps");

module.exports = ({ domain, service, network }) => {
  return {
    add: ({ headers: { root, topic, version, trace, command }, payload }) => {
      return {
        in: context => {
          return {
            with: async tokenFn => {
              const event = {
                context,
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
                .operation(`${domain}.event-store`)
                .post(event)
                .in({ context, service, network })
                .with({ tokenFn });
            }
          };
        }
      };
    },
    aggregate: root => {
      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation(`${domain}.event-store`)
                .get({ root })
                .in({ context, service, network })
                .with({ tokenFn })
          };
        }
      };
    }
  };
};
