/**
 * This file is optional but highly recommended.
 * Add a leading underscore _ to the file's name to omit it.
 * It can be used to validate a payload passed in from the outside world before using it.
 *
 * - Available validator functions --> https://github.com/blossm-network/blossm/blob/master/packages/lib/validator/index.js
 *
 * The function takes in the payload param from the request (req.body.payload),
 * and is responsible for throwing an error if a value wasn't sent as expected.
 *
 * Throw a badRequest error to return a 401 to the client, and
 * a conflict error to return a 409. Conflict errors suggest the user should see the error message.
 */

const { findError, string } = require("@blossm/validator");
const { badRequest, conflict } = require("@blossm/errors");

module.exports = async payload => {
  const systemInputError = findError([string(payload.name)]);
  if (systemInputError) throw badRequest.message(systemInputError.message);

  const userInputError = findError([string(payload.name)]);
  if (userInputError) throw conflict.message(userInputError.message);
};
