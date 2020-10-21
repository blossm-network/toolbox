const { number: numberValidator } = require("@blossm/validation");

module.exports = (number, { fn, title, path, optional } = {}) =>
  numberValidator({
    value: number,
    title,
    path,
    refinementMessageFn: (value, title) =>
      `The value ${value} is invalid for the ${title}.`,

    optional,
    refinementFn: fn,
  });
