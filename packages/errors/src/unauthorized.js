const { UnauthorizedError } = require("restify-errors");

module.exports = {
  tokenInvalid: new UnauthorizedError("Invalid token"),
  tokenExpired: new UnauthorizedError("Token expired"),
  cors: new UnauthorizedError("Not allowed by CORS")
};
