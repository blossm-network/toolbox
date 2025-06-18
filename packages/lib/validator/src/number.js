import { number as numberValidator } from "@blossm/validation";

export default (number, { fn, title, path, optional } = {}) =>
  numberValidator({
    value: number,
    title,
    path,
    refinementMessageFn: (value, title) =>
      `The value ${value} is invalid for the ${title}.`,

    optional,
    refinementFn: fn,
  });
