const deps = require("./deps");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = async ({ tokenFn, service, operation }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash({ operation, service }),
        name: deps.trim(
          `${service}-${operation.reverse().join("-")}`,
          MAX_LENGTH
        )
      })
    : null;
