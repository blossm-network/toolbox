const deps = require("./deps");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

module.exports = async ({ tokenFn, service, procedure }) =>
  tokenFn
    ? await tokenFn({
        hash: deps.hash({ procedure, service }),
        name: deps.trim(
          `${service}-${procedure
            .slice()
            .reverse()
            .join("-")}`,
          MAX_LENGTH
        )
      })
    : null;
