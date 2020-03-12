const deps = require("./deps");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = async ({ tokenFn, operation }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash(...operation),
        name: deps.trim(
          `${operation
            .slice()
            .reverse()
            .join("-")}`,
          MAX_LENGTH
        )
      })
    : null;
