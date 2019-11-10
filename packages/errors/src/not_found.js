const { NotFoundError } = require("restify-errors");

module.exports = {
  root: () => new NotFoundError("Root not found."),
  id: () => new NotFoundError("Id not found."),
  message: message => new NotFoundError(message)
};
