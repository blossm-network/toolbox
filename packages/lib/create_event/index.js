const { string: stringDate } = require("@sustainers/datetime");
const deps = require("./deps");

module.exports = async ({
  root,
  payload,
  version,
  trace,
  context,
  command: { id, issued }
} = {}) => {
  return {
    headers: {
      root: root || (await deps.makeUuid()),
      ...(context != undefined && { context }),
      topic: `did-${process.env.ACTION}.${process.env.DOMAIN}.${process.env.SERVICE}.${process.env.NETWORK}`,
      version,
      trace,
      created: stringDate(),
      command: {
        id,
        action: process.env.ACTION,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK,
        issued
      }
    },
    payload
  };
};
