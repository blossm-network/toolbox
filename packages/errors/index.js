import restifyErrors from "restify-errors";

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
} = restifyErrors;

import createError from "./src/create_error.js";

const badRequest = {
  message: (message, options) => createError(BadRequestError, message, options),
};
const internalServer = {
  message: (message, options) =>
    createError(InternalServerError, message, options),
};
const unauthorized = {
  message: (message, options) =>
    createError(UnauthorizedError, message, options),
};
const resourceNotFound = {
  message: (message, options) =>
    createError(ResourceNotFoundError, message, options),
};
const invalidCredentials = {
  message: (message, options) =>
    createError(InvalidCredentialsError, message, options),
};
const forbidden = {
  message: (message, options) => createError(ForbiddenError, message, options),
};
const invalidArgument = {
  message: (message, options) =>
    createError(InvalidArgumentError, message, options),
};
const conflict = {
  message: (message, options) => createError(ConflictError, message, options),
};
const preconditionFailed = {
  message: (message, options) =>
    createError(PreconditionFailedError, message, options),
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
    default:
      return createError(
        restifyErrors.HttpError,
        message || "The upstream request failed.",
        {
          statusCode:
            Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
              ? statusCode
              : 502,
          code: code || "UpstreamError",
          info,
        }
      );
  }
};

export {
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

export { default as publicError } from "./src/public_error.js";
