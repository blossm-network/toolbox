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

const { findError, object, string } = require("@blossm/validator");

module.exports = async payload => {
  const error = findError([
    object(payload.device, { title: "device", path: "payload.device" })
  ]);
  if (error) throw error;

  const deviceError = findError([
    string(payload.device.os, { title: "os", path: "payload.device.os" }),
    string(payload.device.version, {
      title: "version",
      path: "payload.device.version"
    }),
    string(payload.device.hardware, {
      title: "hardware",
      path: "payload.device.hardware"
    }),
    string(payload.device.manufacturer, {
      title: "manufacturer",
      path: "payload.device.manufacturer"
    }),
    string(payload.device.id, {
      optional: true,
      title: "id",
      path: "payload.device.id"
    })
  ]);
  if (deviceError) throw deviceError;
};
