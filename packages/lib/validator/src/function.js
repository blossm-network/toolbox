import { fn as fnValidator } from "@blossm/validation";

export default (
  fn,
  { baseMessageFn, fn: func, refinementMessageFn, title, path, optional } = {}
) =>
  fnValidator({
    value: fn,
    title,
    path,
    optional,
    refinementFn: func,
    refinementMessageFn,
    baseMessageFn,
  });
