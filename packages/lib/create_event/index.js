const datetime = require("@sustainer-network/datetime");
const deps = require("./deps");

module.exports = async (
  params,
  { action, domain, service, network, root, payload, version } = {}
) => {
  const isStaging = process.env.NODE_ENV == "staging";
  return {
    fact: {
      root: root || (await deps.makeUuid()),
      topic: `did-${action}.${domain}.${service}${
        isStaging ? ".staging" : ""
      }.${network}`,
      ...(params.authorized != undefined && {
        service: params.authorized.service,
        network: params.authorized.network
      }),
      version,
      traceId: params.traceId,
      createdTimestamp: datetime.fineTimestamp(),
      command: {
        id: params.id,
        action,
        domain,
        service,
        network,
        issuedTimestamp: params.issuedTimestamp
      }
    },
    payload
  };
};
