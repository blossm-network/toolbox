const {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  ResourceNotFoundError,
  InvalidArgumentError,
  ConflictError,
  InvalidCredentialsError,
  ForbiddenError,
  PreconditionFailedError,
} = require("restify-errors");

const toJSON = require("./src/to_json");

const badRequest = {
  message: (message, { cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, message),
};
const internalServer = {
  message: (message, { cause, info } = {}) =>
    new InternalServerError({ cause, info, toJSON }, message),
};
const unauthorized = {
  message: (message, { cause, info } = {}) =>
    new UnauthorizedError({ cause, info, toJSON }, message),
};
const resourceNotFound = {
  message: (message, { cause, info } = {}) =>
    new ResourceNotFoundError({ cause, info, toJSON }, message),
};
const invalidCredentials = {
  message: (message, { cause, info } = {}) =>
    new InvalidCredentialsError({ cause, info, toJSON }, message),
};
const forbidden = {
  message: (message, { cause, info } = {}) =>
    new ForbiddenError({ cause, info, toJSON }, message),
};
const invalidArgument = {
  message: (message, { cause, info } = {}) =>
    new InvalidArgumentError({ cause, info, toJSON }, message),
};
const conflict = {
  message: (message, { cause, info } = {}) =>
    new ConflictError({ cause, info, toJSON }, message),
};
const preconditionFailed = {
  message: (message, { cause, info } = {}) =>
    new PreconditionFailedError({ cause, info, toJSON }, message),
};

const construct = ({ statusCode, code, message, info }) => {
  switch (statusCode) {
    case 400:
      return badRequest.message(message, { info });
    case 401:
      return unauthorized.message(message, { info });
    case 403:
      return forbidden.message(message, { info });
    case 404:
      return resourceNotFound.message(message, { info });
    case 409:
      switch (code) {
        case "Conflict":
          return conflict.message(message, { info });
      }
      return invalidArgument.message(message, { info });
    case 412:
      return preconditionFailed.message(message, { info });
    case 500:
      return internalServer.message(message, { info });
  }
};

module.exports = {
  badRequest,
  resourceNotFound,
  construct,
  internalServer,
  invalidCredentials,
  invalidArgument,
  conflict,
  forbidden,
  unauthorized,
  preconditionFailed,
};
