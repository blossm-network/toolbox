import { string as stringValidator } from "@blossm/validation";
import isUuid from "@blossm/uuid-validator";

export default (
  value,
  { baseMessageFn, title = "uuid", path, optional } = {}
) =>
  stringValidator({
    value,
    baseMessageFn,
    title,
    path,
    refinementMessageFn: (_, title) =>
      `This ${title.toLowerCase()} isn't formatted right`,
    refinementFn: (uuid) => {
      const valid = isUuid(uuid);
      if (!valid) throw `${uuid} is not a valid uuid.`;
    },
    optional,
  });
