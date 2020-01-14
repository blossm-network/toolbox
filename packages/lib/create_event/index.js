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
  command
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
      ...(command && {
        command: {
          id: command.id,
          action: command.action,
          domain: command.domain,
          service: command.service,
          network: command.network,
          issued: command.issued
        }
      })
    },
    payload
  };
};
