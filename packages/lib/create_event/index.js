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
      commandInstanceId: body.commandInstanceId,
      commandAction: body.action,
      commandDomain: body.domain,
      commandService: body.service,
      commandIssuedTimestamp: body.issuedTimestamp
    },
    payload
  };
};
