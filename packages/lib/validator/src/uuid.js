const { string: stringValidator } = require("@blossm/validation");
const isUuid = require("@blossm/uuid-validator");

module.exports = (
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
