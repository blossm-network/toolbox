const logger = require("@sustainers/logger");

module.exports = (err, _, res, next) => {
  if (res.headersSent) return next(err);

  logger.error("Hmm A server error occured: ", {
    statusCode: err.statusCode,
    err,
    stack: err.stack
  });
  if (err.statusCode >= 500) {
    logger.error("A server error occured: ", { err, stack: err.stack });
  }

  //If unauthorized, remove cookie;
  if (err.statusCode === 401) res.clearCookie("token");

  res.status(err.statusCode || 500).send(err);
  next();
};
