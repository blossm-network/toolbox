const {
  object,
  objectArray,
  string,
  date,
  findError
} = require("@blossm/validator");
const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

module.exports = async params => {
  const error = findError([
    object(params.headers, { title: "headers", path: "headers" }),
    object(params.payload, {
      optional: true,
      title: "payload",
      path: "payload"
    })
  ]);

  if (error) throw error;

  const headersError = findError([
    string(params.headers.trace, {
      optional: true,
      title: "trace",
      path: "headers.trace"
    }),
    //TODO do headers have a root?
    string(params.headers.root, {
      optional: true,
      title: "root",
      path: "headers.root"
    }),
    //TODO
    objectArray(params.headers.path, {
      optional: true,
      title: "path",
      path: "headers.path"
    }),
    date(params.headers.issued, {
      title: "issued date",
      headers: "headers.issued"
    }),
    //TODO
    date(params.headers.broadcasted, {
      title: "issued date",
      headers: "headers.broadcasted",
      optional: true
    })
  ]);

  if (headersError) throw headersError;

  if (
    new Date() < new Date(params.headers.issued) ||
    new Date().getTime() - new Date(params.headers.issued).getTime() >
      SECONDS_IN_DAY * 1000
  ) {
    throw deps.badRequestError.message("The issued timestamp seems incorrect.");
  }
  if (
    params.headers.broadcasted != undefined &&
    (new Date() < new Date(params.headers.broadcasted) ||
      new Date().getTime() - new Date(params.headers.broadcasted).getTime() >
        SECONDS_IN_DAY * 1000)
  ) {
    throw deps.badRequestError.message(
      "The broadcasted timestamp seems incorrect."
    );
  }
};
