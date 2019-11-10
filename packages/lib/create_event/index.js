const { string: stringDate } = require("@blossm/datetime");
const deps = require("./deps");

module.exports = async ({
  root,
  payload,
  version,
  trace,
  context,
  command: { id, issued, action, domain, service, network }
} = {}) => {
  return {
    headers: {
      root: root || (await deps.makeUuid()),
      ...(context != undefined && { context }),
      topic: `did-${action}.${domain}.${service}.${network}`,
      version,
      trace,
      created: stringDate(),
      command: {
        id,
        action,
        domain,
        service,
        network,
        issued
      }
    },
    payload
  };
};
