const datetime = require("@sustainer-network/datetime");
const deps = require("./deps");

module.exports = async (
  body,
  { root, topic, service, payload, version } = {}
) => {
  return {
    fact: {
      root: root || (await deps.makeUuid()),
      topic,
      service,
      version,
      traceId: body.traceId,
      commandInstanceId: body.commandInstanceId,
      command: body.name,
      commandIssuedTimestamp: body.issuedTimestamp,
      createdTimestamp: datetime.fineTimestamp()
    },
    payload
  };
};
