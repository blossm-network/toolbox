const { string: stringDate } = require("@blossm/datetime");
const deps = require("./deps");

module.exports = async ({
  root,
  payload,
  version = 0,
  trace,
  action,
  domain,
  service,
  idempotency,
  command
} = {}) => {
  return {
    headers: {
      root: root || (await deps.uuid()),
      action,
      domain,
      service,
      topic: `did-${action}.${domain}.${service}`,
      version,
      created: stringDate(),
      idempotency: idempotency || (await deps.uuid()),
      ...(trace != undefined && { trace }),
      ...(command && {
        command: {
          id: command.id,
          name: command.name,
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
