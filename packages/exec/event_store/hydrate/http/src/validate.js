const { findError, string } = require("@sustainer-network/validator");
const { badRequest } = require("@sustainer-network/errors");

module.exports = async params => {
  const systemInputError = findError([
    string(params.domain, { shouldAllowEmptyString: false }),
    string(params.service, { shouldAllowEmptyString: false }),
    string(params.root)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);
};
