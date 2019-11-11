const findError = require("./find_error");
const object = require("./object");
const string = require("./string");

module.exports = (
  name,
  { optional, title = "name", lastNameOptional } = {}
) => {
  const err = findError([object(name, { optional, title })]);

  if (err) return err;

  if (name == undefined) return;

  const nameErr = findError([
    string(name.first, { title }),
    string(name.last, { optional: lastNameOptional, title })
  ]);

  if (nameErr) return nameErr;
};
