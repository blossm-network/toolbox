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
  service,
  idempotency,
  command: {
    id,
    issued,
    action: commandAction,
    domain: commandDomain,
    service: commandService,
    network: commandNetwork
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
      idempotency: idempotency || (await deps.uuid()),
      command: {
        id,
        action: commandAction,
        domain: commandDomain,
        service: commandService,
        network: commandNetwork,
        issued
      }
    },
    payload
  };
};
