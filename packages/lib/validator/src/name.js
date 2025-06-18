import findError from "./find_error.js";
import object from "./object.js";
import string from "./string.js";

export default (
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
