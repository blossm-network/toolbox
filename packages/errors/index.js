const badRequest = require("./src/bad_request");
const internalServer = require("./src/internal_server");
const unauthorized = require("./src/unauthorized");
const notFound = require("./src/not_found");
const construct = require("./src/construct");

module.exports = {
  badRequest,
  notFound,
  construct,
  internalServer,
  unauthorized
};
