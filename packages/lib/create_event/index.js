const datetime = require("@sustainer-network/datetime");
const deps = require("./deps");

module.exports = async (
  params,
  { action, domain, service, root, payload, version } = {}
) => {
  const isStaging = process.env.NODE_ENV == "staging";
  return {
    fact: {
      root: root || (await deps.makeUuid()),
      topic: `did-${action}.${domain}.${service}${isStaging ? ".staging" : ""}`,
      service: params.authorizedService,
      version,
      traceId: params.traceId,
      createdTimestamp: datetime.fineTimestamp(),
      command: {
        id: params.id,
        action,
        domain,
        service,
        issuedTimestamp: params.issuedTimestamp
      }
    },
    payload
  };
};
