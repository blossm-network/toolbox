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
