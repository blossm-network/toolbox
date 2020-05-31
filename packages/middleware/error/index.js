const logger = require("@blossm/logger");

module.exports = (err, _, res, next) => {
  if (res.headersSent) return next(err);

  if (!err.statusCode || err.statusCode >= 500) {
    logger.error("A server error occured: ", { err, stack: err.stack });
  }

  //If unauthorized, remove cookie;
  if (err.statusCode === 401) res.clearCookie("token");

  res.status(err.statusCode || 500).send({
    ...(err.statusCode && { statusCode: err.statusCode }),
    ...(err.code && { code: err.code }),
    ...(err.message && { message: err.message }),
    ...(err.info && { info: err.info }),
  });

  next();
};
