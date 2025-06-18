import { numberArray as numberArrayValidator } from "@blossm/validation";

export default (
  numberArray,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  numberArrayValidator({
    value: numberArray,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    optional,
    refinementFn: fn,
  });
