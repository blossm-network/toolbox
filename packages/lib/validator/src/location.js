const findError = require("./find_error");
const object = require("./object");
const string = require("./string");
const countryCode = require("./country_code");

module.exports = (location, { title = "location", optional } = {}) => {
  const err = findError([object(location, { optional, title })]);
  if (err) return err;

  if (location == undefined) return;

  const locationIdErr = findError([
    string(location.id, { optional: true, title })
  ]);

  if (locationIdErr) return locationIdErr;
  if (location.id != undefined) return;

  const fallbackErr = findError([
    string(location.postalCode, { title }),
    countryCode(location.countryCode, { title })
  ]);

  if (fallbackErr) return fallbackErr;
};
