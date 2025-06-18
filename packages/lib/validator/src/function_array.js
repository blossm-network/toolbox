import { fnArray as fnArrayValidator } from "@blossm/validation";

export default (
  fnArray,
  { title, path, baseMessageFn, refinementMessageFn, fn, optional } = {}
) =>
  fnArrayValidator({
    value: fnArray,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    optional,
  });
