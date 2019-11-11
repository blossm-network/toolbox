const badRequest = require("./bad_request");
const internalServer = require("./internal_server");
const unauthorized = require("./unauthorized");
const notFound = require("./not_found");

module.exports = ({ statusCode, message }) => {
  switch (statusCode) {
  case 400:
    return badRequest.message(message);
  case 401:
    return unauthorized.message(message);
  case 404:
    return notFound.message(message);
  case 500:
    return internalServer.message(message);
  }
};
