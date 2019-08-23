const request = require("@sustainer-network/request");
const datetime = require("@sustainer-network/datetime");

module.exports = {
  add: async ({
    fact: { root, topic, service, version, traceId, command },
    payload
  }) => {
    const isStaging = process.env.NODE_ENV == "staging";
    const event = {
      fact: {
        root,
        topic,
        service,
        version,
        createdTimestamp: datetime.fineTimestamp(),
        ...(traceId && { traceId }),
        command: {
          id: command.id,
          action: command.action,
          domain: command.domain,
          service: command.service,
          issuedTimestamp: command.issuedTimestamp
        }
      },
      payload
    };

    await request.post(
      `https://event-store${isStaging ? ".staging" : ""}.sustainer.network/add`,
      { event, domain: command.domain, service: command.service }
    );
  },
  hydrate: async ({ root, domain, service }) => {
    const isStaging = process.env.NODE_ENV == "staging";
    await request.get(
      `https://event-store${
        isStaging ? ".staging" : ""
      }.sustainer.network/hydrate`,
      { root, domain, service }
    );
  }
};
