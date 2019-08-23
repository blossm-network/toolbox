const datetime = require("@sustainer-network/datetime");
const deps = require("./deps");

module.exports = async (body, { root, payload, version } = {}) => {
  return {
    fact: {
      root: root || (await deps.makeUuid()),
      topic: `did-${body.action}.${body.domain}.${body.service}`,
      service: body.authorizedService,
      version,
      traceId: body.traceId,
      createdTimestamp: datetime.fineTimestamp(),
      command: {
        id: body.id,
        action: body.action,
        domain: body.domain,
        service: body.service,
        issuedTimestamp: body.issuedTimestamp
      }
    },
    payload
  };
};
