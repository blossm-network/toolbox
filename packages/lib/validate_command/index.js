const { object, string, date, findError } = require("@blossm/validator");
const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

module.exports = async params => {
  const systemInputError = findError([
    object(params.headers, { title: "headers" }),
    object(params.payload, { optional: true, title: "payload" })
  ]);

  if (systemInputError) {
    throw deps.badRequestError.message(systemInputError.message);
  }

  const headersSystemInputError = findError([
    string(params.headers.trace, { optional: true, title: "trace" }),
    string(params.headers.root, { optional: true, title: "root" }),
    object(params.headers.source, { optional: true, title: "source" }),
    date(params.headers.issued, { title: "issued date" })
  ]);

  if (headersSystemInputError) {
    throw deps.badRequestError.message(headersSystemInputError.message);
  }

  if (
    new Date() < new Date(params.headers.issued) ||
    new Date().getTime() - new Date(params.headers.issued).getTime() >
      SECONDS_IN_DAY * 1000
  ) {
    throw deps.badRequestError.message("The issued timestamp seems incorrect.");
  }
};
