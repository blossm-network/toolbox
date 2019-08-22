const request = require("@sustainer-network/request");
const datetime = require("@sustainer-network/datetime");

module.exports = ({ domain, service }) => {
  const isStaging = process.env.NODE_ENV == "staging";
  const _service = service;
  return {
    add: async ({
      fact: {
        root,
        topic,
        service,
        version,
        traceId,
        commandInstanceId,
        command,
        commandIssuedTimestamp
      },
      payload
    }) => {
      const event = {
        fact: {
          root,
          topic,
          service,
          version,
          commandInstanceId,
          command,
          ...(commandIssuedTimestamp && { commandIssuedTimestamp }),
          ...(traceId && { traceId }),
          createdTimestamp: datetime.fineTimestamp()
        },
        payload
      };

      await request.post(
        `https://event-store${
          isStaging ? ".staging" : ""
        }.sustainer.network/add`,
        { event, domain, service: _service }
      );
    },
    hydrate: async root => {
      await request.get(
        `https://event-store${
          isStaging ? ".staging" : ""
        }.sustainer.network/hydrate`,
        { root, domain, service: _service }
      );
    }
  };
};
