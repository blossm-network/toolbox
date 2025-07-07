import { string as dateString } from "@blossm/datetime";
import deps from "./deps.js";

export default ({
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
  console.log({ payload });
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
