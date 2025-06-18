import { object as objectValidator } from "@blossm/validation";

export default (
  object,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  objectValidator({
    value: object,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    optional,
  });
