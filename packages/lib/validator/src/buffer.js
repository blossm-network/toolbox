const { object: objectValidator } = require("@blossm/validation");

module.exports = (buffer, { baseMessageFn, title = "", optional } = {}) =>
  objectValidator({
    value: buffer,
    baseMessageFn,
    refinementMessageFn: (_, title) => `This ${title} buffer is invalid.`,
    refinementFn: object => Buffer.isBuffer(object),
    title,
    optional
  });
