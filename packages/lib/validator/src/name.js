const findError = require("./find_error");
const object = require("./object");
const string = require("./string");

module.exports = (name, { optional, lastNameOptional } = {}) => {
  const err = findError([object(name, { optional })]);

  if (err) return err;

  if (name == undefined) return;

  const nameErr = findError([
    string(name.first),
    string(name.last, { optional: lastNameOptional })
  ]);

  if (nameErr) return nameErr;
};
