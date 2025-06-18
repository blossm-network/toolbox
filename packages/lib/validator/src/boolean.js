import { boolean as booleanValidator } from "@blossm/validation";

export default (
  boolean,
  { baseMessageFn, refinementMessageFn, fn, title, path, optional } = {}
) =>
  booleanValidator({
    value: boolean,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    title,
    path,
    optional,
  });
