import logger from "@blossm/logger";

export default (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (!err.statusCode || err.statusCode >= 500) {
    logger.error("A server error occured: ", {
      err,
      stack: err.stack,
      ...(req.body && { body: req.body }),
      ...(req.query && { query: req.query }),
      ...(req.params && { params: req.params }),
    });
  } else if (err.statusCode >= 400) {
    logger.info("A user error occured: ", {
      err,
      stack: err.stack,
      ...(req.body && { body: req.body }),
      ...(req.query && { query: req.query }),
      ...(req.params && { params: req.params }),
    });
  }

  //If unauthorized, remove cookie; TODO change to 'access'
  if (err.statusCode === 401) res.clearCookie("access");

  res.status(err.statusCode || 500).send(err);
  next();
};
