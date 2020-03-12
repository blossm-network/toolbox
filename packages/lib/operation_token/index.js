const deps = require("./deps");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = async ({ tokenFn, procedure }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash(procedure),
        name: deps.trim(
          `${procedure
            .slice()
            .reverse()
            .join("-")}`,
          MAX_LENGTH
        )
      })
    : null;
