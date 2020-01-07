const badRequest = require("./src/bad_request");
const internalServer = require("./src/internal_server");
const unauthorized = require("./src/unauthorized");
const resourceNotFound = require("./src/resource_not_found");
const invalidCredentials = require("./src/invalid_credentials");
const forbidden = require("./src/forbidden");
const invalidArgument = require("./src/invalid_argument");
const construct = require("./src/construct");
const preconditionFailed = require("./src/precondition_failed");

module.exports = {
  badRequest,
  resourceNotFound,
  construct,
  internalServer,
  invalidCredentials,
  invalidArgument,
  forbidden,
  unauthorized,
  preconditionFailed
};
