import { string as stringValidator } from "@blossm/validation";
import findError from "./find_error.js";
import number from "./number.js";

export default (
  value,
  { baseMessageFn, title = "date", path, optional } = {}
) =>
  stringValidator({
    value,
    title,
    path,
    baseMessageFn,
    refinementMessageFn: (_, title) =>
      `This ${title.toLowerCase()} couldn't be parsed. Try again after making a change to it.`,
    refinementFn: (value) => !findError([number(Date.parse(value))]),
    optional,
  });
