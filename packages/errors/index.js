const badRequest = require("./src/bad_request");
const conflict = require("./src/conflict");
const internalServer = require("./src/internal_server");
const unauthorized = require("./src/unauthorized");

module.exports = {
  badRequest,
  conflict,
  internalServer,
  unauthorized
};
