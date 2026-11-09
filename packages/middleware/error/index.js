import logger from "@blossm/logger";
import { publicError } from "@blossm/errors";

export default (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const error = publicError(err);
  const log = error.statusCode >= 500 ? logger.error : logger.info;
  // Native messages can echo credentials. Keep their call sites, not the
  // complete message prefix (which may itself span multiple lines).
  const label = err.message ? `${err.name}: ${err.message}` : err.name;
  const stack =
    typeof err.stack == "string" && err.stack.startsWith(`${label}\n`)
      ? err.stack
          .slice(label.length + 1)
          .split("\n")
          .filter((line) => line.startsWith("    at "))
          .join("\n")
      : undefined;
  log("A request failed.", {
    statusCode: error.statusCode,
    code: error.code,
    message: error.message,
    info: error.info,
    ...(err instanceof Error && { errorType: err.constructor.name }),
    ...(stack && { stack }),
  });

  //If unauthorized, remove cookie; TODO change to 'access'
  if (error.statusCode === 401) res.clearCookie("access");

  res.status(error.statusCode).send(error);
  next();
};
