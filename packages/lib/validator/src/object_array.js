import { objectArray as objectArrayValidator } from "@blossm/validation";

export default (
  objectArray,
  { title, path, baseMessageFn, fn, refinementMessageFn, optional } = {}
) =>
  objectArrayValidator({
    value: objectArray,
    title,
    path,
    baseMessageFn,
    refinementFn: fn,
    refinementMessageFn,
    optional,
  });
