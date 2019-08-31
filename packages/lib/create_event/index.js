const datetime = require("@sustainer-network/datetime");
const deps = require("./deps");

module.exports = async ({
  root,
  payload,
  version,
  traceId,
  context,
  command: { id, issuedTimestamp }
} = {}) => {
  return {
    ...(context != undefined && { context }),
    fact: {
      root: root || (await deps.makeUuid()),
      topic: `did-${process.env.ACTION}.${process.env.DOMAIN}.${process.env.SERVICE}.${process.env.NETWORK}`,
      version,
      traceId,
      createdTimestamp: datetime.fineTimestamp(),
      command: {
        id,
        action: process.env.ACTION,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK,
        issuedTimestamp
      }
    },
    payload
  };
};
