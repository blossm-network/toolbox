const findError = require("./find_error");
const object = require("./object");
const shortString = require("./short_string");

module.exports = (name, { optional, lastNameOptional } = {}) => {
  const err = findError([object(name, { optional })]);

  if (err) return err;

  if (name == undefined) return;

  const nameErr = findError([
    shortString(name.first, "First name"),
    shortString(name.last, "Last name", { optional: lastNameOptional })
  ]);

  if (nameErr) return nameErr;
};
