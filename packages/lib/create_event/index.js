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
  groupsAdded,
  groupsRemoved,
  idempotency,
  path,
} = {}) => {
  return {
    headers: {
      root: root || deps.uuid(),
      topic: `${action}.${domain}.${service}`,
      idempotency: Buffer.from(
        `${idempotency || deps.uuid()}-${
          root ? `${root}-` : ""
        }${action}-${domain}-${service}${
          path
            ? `-${(path || []).reduce((result, p) => result + p.hash, "")}`
            : ""
        }${deps.cononicalString(payload)}`
      ).toString("hex"),
      created: dateString(),
      action,
      domain,
      service,
      network,
      version,
    },
    ...(context && { context }),
    ...(groupsAdded && { groupsAdded }),
    ...(groupsRemoved && { groupsRemoved }),
    payload,
  };
};
