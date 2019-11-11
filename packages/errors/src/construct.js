const badRequest = require("./bad_request");
const internalServer = require("./internal_server");
const unauthorized = require("./unauthorized");
const resourceNotFound = require("./resource_not_found");
const invalidArgument = require("./invalid_argument");

module.exports = ({ statusCode, message }) => {
  switch (statusCode) {
  case 400:
    return badRequest.message(message);
  case 401:
    return unauthorized.message(message);
  case 404:
    return resourceNotFound.message(message);
  case 409:
    return invalidArgument.message(message);
  case 500:
    return internalServer.message(message);
  }
};
