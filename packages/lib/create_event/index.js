const deps = require("./deps");

module.exports = async (
  body,
  { root, topic, serviceDomain, payload, version } = {}
) => {
  return {
    fact: {
      root: root || (await deps.makeUuid()),
      topic,
      serviceDomain,
      version,
      traceId: body.traceId,
      commandInstanceId: body.commandInstanceId,
      command: body.name,
      commandIssuedTimestamp: body.issuedTimestamp
    },
    payload
  };
};
