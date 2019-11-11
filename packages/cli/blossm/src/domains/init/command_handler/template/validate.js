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
 * Throw a badRequest error to return a 400 to the client with a descriptive message.
 */

const { findError, string } = require("@blossm/validator");

module.exports = async payload => {
  const error = findError([
    string(payload.name, { title: "name", path: "payload.name" })
  ]);
  if (error) throw error;
};
