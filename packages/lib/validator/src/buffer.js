import { object as objectValidator } from "@blossm/validation";

export default (
  buffer,
  { baseMessageFn, title = "buffer", path, optional } = {}
) =>
  objectValidator({
    value: buffer,
    baseMessageFn,
    refinementMessageFn: (_, title) => `This ${title} is invalid.`,
    refinementFn: (object) => Buffer.isBuffer(object),
    title,
    path,
    optional,
  });
