import logger from "@blossm/logger";
import { publicError } from "@blossm/errors";

export default (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const error = publicError(err);
  const log = error.statusCode >= 500 ? logger.error : logger.info;
  log("A request failed.", { statusCode: error.statusCode, code: error.code });

  //If unauthorized, remove cookie; TODO change to 'access'
  if (error.statusCode === 401) res.clearCookie("access");

  res.status(error.statusCode).send(error);
  next();
};
