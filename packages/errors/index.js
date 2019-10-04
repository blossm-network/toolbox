const badRequest = require("./src/bad_request");
const conflict = require("./src/conflict");
const internalServer = require("./src/internal_server");
const unauthorized = require("./src/unauthorized");
const notFound = require("./src/not_found");
const construct = require("./src/construct");

module.exports = {
  badRequest,
  conflict,
  construct,
  internalServer,
  unauthorized,
  notFound
};
