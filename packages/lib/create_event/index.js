import { string as dateString } from "@blossm/datetime";
import deps from "./deps.js";

export default ({
  root,
  payload,
  version = 0,
  canonicalFormat = 2,
  action,
  domain,
  service,
  network,
  context,
  groupsAdded,
  groupsRemoved,
  idempotency,
  path,
} = {}) => ({
    headers: {
      root: root || deps.uuid(),
      topic: `${action}.${domain}.${service}`,
      idempotency: `${canonicalFormat == 2 ? "v2:" : ""}${Buffer.from(
        `${idempotency || deps.uuid()}-${
          root ? `${root}-` : ""
        }${action}-${domain}-${service}${
          path
            ? `-${(path || []).reduce((result, p) => result + p.hash, "")}`
            : ""
        }${deps.cononicalString(payload, { canonicalFormat })}`
      ).toString("hex")}`,
      created: dateString(),
      action,
      domain,
      service,
      network,
      version,
      ...(canonicalFormat == 2 && { canonicalFormat }),
    },
    ...(context && { context }),
    ...(groupsAdded && { groupsAdded }),
    ...(groupsRemoved && { groupsRemoved }),
    payload,
  });
