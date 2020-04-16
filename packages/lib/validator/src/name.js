const findError = require("./find_error");
const object = require("./object");
const string = require("./string");

module.exports = (
  name,
  { optional, title = "name", path, lastNameOptional } = {}
) => {
  const err = findError([object(name, { optional, title, path })]);

  if (err) return err;

  if (name == undefined) return;

  const nameErr = findError([
    string(name.first, { title, path: `${path}.first` }),
    string(name.last, {
      optional: lastNameOptional,
      title,
      path: `${path}.last`,
    }),
  ]);

  if (nameErr) return nameErr;
};
