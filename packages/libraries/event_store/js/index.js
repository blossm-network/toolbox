const request = require("@sustainer-network/request");
const datetime = require("@sustainer-network/datetime");

module.exports = {
  add: async ({
    context,
    fact: { root, topic, version, traceId, command },
    payload
  }) => {
    const isStaging = process.env.NODE_ENV == "staging";
    const event = {
      context,
      fact: {
        root,
        topic,
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
      `https://add.event-store.core${
        isStaging ? ".staging" : ""
      }.sustainer.network`,
      { event, domain: command.domain, service: command.service }
    );
  },
  aggregate: async ({ root, domain, service }) => {
    const isStaging = process.env.NODE_ENV == "staging";
    await request.get(
      `https://aggregate.event-store.core${
        isStaging ? ".staging" : ""
      }.sustainer.network`,
      { root, domain, service }
    );
  }
};
