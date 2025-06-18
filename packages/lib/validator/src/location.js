import findError from "./find_error.js";
import object from "./object.js";
import string from "./string.js";
import countryCode from "./country_code.js";

export default (location, { title = "location", path, optional } = {}) => {
  const err = findError([object(location, { optional, title, path })]);
  if (err) return err;

  if (location == undefined) return;

  const locationIdErr = findError([
    string(location.id, { optional: true, title, path: `${path}.id` }),
  ]);

  if (locationIdErr) return locationIdErr;
  if (location.id != undefined) return;

  const fallbackErr = findError([
    string(location.postalCode, { title, path: `${path}.postalCode` }),
    countryCode(location.countryCode, { title, path: `${path}.countryCode` }),
  ]);

  if (fallbackErr) return fallbackErr;
};
