const findError = require("./find_error");
const object = require("./object");
const string = require("./string");
const countryCode = require("./country_code");

module.exports = (location, { title = "location", path, optional } = {}) => {
  const err = findError([object(location, { optional, title, path })]);
  if (err) return err;

  if (location == undefined) return;

  const locationIdErr = findError([
    string(location.id, { optional: true, title, path: `${path}.id` })
  ]);

  if (locationIdErr) return locationIdErr;
  if (location.id != undefined) return;

  const fallbackErr = findError([
    string(location.postalCode, { title, path: `${path}.postalCode` }),
    countryCode(location.countryCode, { title, path: `${path}.countryCode` })
  ]);

  if (fallbackErr) return fallbackErr;
};
