const findError = require("./find_error");
const string = require("./string");

module.exports = (domain, { optional, title = "domain", path } = {}) => {
  const err = findError([
    string(domain, {
      fn: (domain) => domain.includes("."),
      optional,
      title,
      path,
    }),
  ]);

  if (err) return err;
};
