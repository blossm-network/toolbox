const { info } = require("restify-errors");

module.exports = () => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ thisBe: this, thisInfo: info(this), thisRawInfo: this.info() });
  return {
    statusCode: this.statusCode,
    code: this.body.code,
    message: this.message,
    ...(info(this) && { info: info(this) }),
    ...(this.cause() && { cause: this.cause() }),
  };
};
