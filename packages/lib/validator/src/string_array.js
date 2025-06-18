import { stringArray as stringArrayValidator } from "@blossm/validation";

export default (
  stringArray,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  stringArrayValidator({
    value: stringArray,
    optional,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
  });
