const deps = require("./deps");

module.exports = async (
  body,
  { root, topic, serviceDomain, payload, version } = {}
) => {
  return {
    root: root || (await deps.makeUuid()),
    topic,
    serviceDomain,
    payload,
    version,
    traceId: body.traceId,
    commandInstanceId: body.commandInstanceId,
    command: body.name,
    commandIssuedTimestamp: body.issuedTimestamp
  };
};
