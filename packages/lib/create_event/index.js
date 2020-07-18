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
  context,
  idempotency,
  path,
} = {}) => {
  return {
    root: root || deps.uuid(),
    topic: `${action}.${domain}.${service}`,
    idempotency: `${idempotency || deps.uuid()}-${action}-${domain}-${service}${
      path ? `-${(path || []).reduce((result, p) => result + p.hash, "")}` : ""
    }`,
    headers: {
      action,
      domain,
      service,
      version,
      created: dateString(),
      ...(context && { context }),
      ...(trace && { trace }),
      ...(path && {
        path: path.map((p) => {
          return {
            ...(p.name && { name: p.name }),
            ...(p.domain && { domain: p.domain }),
            ...(p.service && { service: p.service }),
            ...(p.issued && { issued: p.issued }),
            ...(p.id && { id: p.id }),
            timestamp: p.timestamp,
            network: p.network,
            hash: p.hash,
            procedure: p.procedure,
            host: p.host,
          };
        }),
      }),
    },
    payload,
  };
};
