import findError from "./find_error.js";
import string from "./string.js";

export default (domain, { optional, fn, title = "domain", path } = {}) => {
  const err = findError([
    string(domain, {
      fn: (domain) => domain.includes(".") && (!fn || fn(domain)),
      optional,
      title,
      path,
    }),
  ]);

  if (err) return err;
};
