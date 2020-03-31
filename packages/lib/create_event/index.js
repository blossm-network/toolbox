const { string: dateString } = require("@blossm/datetime");
const deps = require("./deps");

module.exports = ({
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
      root: root || deps.uuid(),
      action,
      domain,
      service,
      topic: `did-${action}.${domain}.${service}`,
      version,
      created: dateString(),
      idempotency: idempotency || deps.uuid(),
      ...(trace != undefined && { trace }),
      ...(command && {
        command: {
          id: command.id,
          name: command.name,
          domain: command.domain,
          service: command.service,
          network: command.network,
          issued: command.issued,
          accepted: command.accepted,
          ...(command.broadcasted && { broadcasted: command.broadcasted })
        }
      })
    },
    payload
  };
};
