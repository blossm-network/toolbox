const { string: stringDate } = require("@blossm/datetime");
const deps = require("./deps");

module.exports = async ({
  root,
  payload,
  version = 0,
  trace,
  context,
  action,
  domain,
  command: {
    id,
    issued,
    action: commandAction,
    domain: commandDomain,
    service,
    network
  }
} = {}) => {
  return {
    headers: {
      root: root || (await deps.uuid()),
      ...(context != undefined && { context }),
      topic: `did-${action}.${domain}.${service}`,
      version,
      trace,
      created: stringDate(),
      command: {
        id,
        action: commandAction,
        domain: commandDomain,
        service,
        network,
        issued
      }
    },
    payload
  };
};
