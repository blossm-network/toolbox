const { object: objectValidator } = require("@blossm/validation");

module.exports = (buffer, { optional } = {}) => {
  return objectValidator({
    value: buffer,
    message: () => "Invalid buffer",
    fn: object => Buffer.isBuffer(object),
    optional
  });
};
