const { badRequest, forbidden, resourceNotFound } = require("@blossm/errors");

exports.dwolla = (key, secret, { environment }) => {
  const Client = require("dwolla-v2").Client;
  return new Client({
    key,
    secret,
    environment,
  });
};

const FormData = require("form-data");

exports.badRequestError = badRequest;
exports.forbiddenError = forbidden;
exports.resourceNotFoundError = resourceNotFound;
exports.FormData = FormData;
