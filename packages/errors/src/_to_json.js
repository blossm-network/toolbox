module.exports = function() {
  return {
    statusCode: this.statusCode,
    code: this.body.code,
    message: this.message,
    ...(this.info() && { info: this.info() }),
    ...(this.cause() && { cause: this.cause() })
  };
};
