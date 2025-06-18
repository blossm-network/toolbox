import { booleanArray as booleanArrayValidator } from "@blossm/validation";

export default (
  booleanArray,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  booleanArrayValidator({
    value: booleanArray,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    title,
    path,
    optional,
  });
