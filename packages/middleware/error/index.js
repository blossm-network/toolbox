const logger = require("@blossm/logger");

module.exports = (err, _, res, next) => {
  logger.error("TEMP ERR PRINT: ", { err });
  if (res.headersSent) return next(err);

  if (!err.statusCode || err.statusCode >= 500) {
    logger.error("A server error occured: ", { err, stack: err.stack });
  }

  //If unauthorized, remove cookie;
  if (err.statusCode === 401) res.clearCookie("token");

  res.status(err.statusCode || 500).send(err);
  next();
};
