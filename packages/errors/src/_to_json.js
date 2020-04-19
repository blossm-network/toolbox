const { info } = require("restify-errors");

module.exports = function () {
  return {
    statusCode: this.statusCode,
    code: this.body.code,
    message: this.message,
    ...(info(this) && { info: info(this) }),
    ...(this.cause() && { cause: this.cause() }),
  };
};
