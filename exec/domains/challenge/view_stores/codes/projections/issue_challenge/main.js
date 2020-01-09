const deps = require("./deps");

module.exports = async event => {
  return {
    code: event.payload.code,
    expires: deps.stringFromDate(
      deps
        .moment()
        .add(event.payload.expires, "s")
        .toDate()
    )
  };
};
