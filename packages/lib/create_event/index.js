const { string: dateString } = require("@blossm/datetime");
const deps = require("./deps");

module.exports = ({
  root,
  payload,
  version = 0,
  action,
  domain,
  service,
  network,
  context,
  idempotency,
  path,
} = {}) => {
  return {
    headers: {
      root: root || deps.uuid(),
      topic: `${action}.${domain}.${service}`,
      idempotency: `${
        idempotency || deps.uuid()
      }-${action}-${domain}-${service}${
        path
          ? `-${(path || []).reduce((result, p) => result + p.hash, "")}`
          : ""
      }`,
      created: dateString(),
      action,
      domain,
      service,
      network,
      version,
    },
    ...(context && { context }),
    payload,
  };
};
