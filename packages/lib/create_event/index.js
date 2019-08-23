const datetime = require("@sustainer-network/datetime");
const deps = require("./deps");

module.exports = async (
  body,
  { action, domain, service, root, payload, version } = {}
) => {
  const isStaging = process.env.NODE_ENV == "staging";
  return {
    fact: {
      root: root || (await deps.makeUuid()),
      topic: `did-${action}.${domain}.${isStaging ? "staging." : ""}${service}`,
      service: body.authorizedService,
      version,
      traceId: body.traceId,
      createdTimestamp: datetime.fineTimestamp(),
      command: {
        id: body.id,
        action,
        domain,
        service,
        issuedTimestamp: body.issuedTimestamp
      }
    },
    payload
  };
};
