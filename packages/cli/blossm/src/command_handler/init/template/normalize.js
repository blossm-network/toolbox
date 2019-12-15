/**
 * This file is optional but recommended.
 * Add a leading underscore _ to the file's name to omit it.
 *
 * It can be used to format, remove unexpected properties from
 * a payload passed in from the outside world, and add global properties
 * before processing.
 *
 * The function takes in the payload param from the request (req.body.payload),
 * and is responsible for returning a formatted and cleaned version of the payload.
 *
 */

module.exports = async payload => {
  return {
    name: payload.name.toLowerCase()
  };
};
