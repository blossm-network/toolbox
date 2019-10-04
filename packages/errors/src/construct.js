const badRequest = require("./bad_request");
const conflict = require("./conflict");
const internalServer = require("./internal_server");
const notFound = require("./not_found");
const unauthorized = require("./unauthorized");

module.exports = ({ statusCode, message }) => {
  switch (statusCode) {
  case 400:
    return badRequest.message(message);
  case 401:
    return unauthorized.message(message);
  case 404:
    return notFound.message(message);
  case 409:
    return conflict.message(message);
  case 500:
    return internalServer.message(message);
  }
};
