const logger = require("@sustainers/logger");

module.exports = (err, _, res, next) => {
  if (res.headersSent) throw err;
  logger.error("An error occured: ", { err, stack: err.stack });

  //If unauthorized, remove cookie;
  if (err.statusCode === 401) res.clearCookie("token");

  res.status(err.statusCode || 500).send(err);
  next();
};
