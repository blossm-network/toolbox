const { findError, string } = require("@sustainer-network/validator");
const { badRequest } = require("@sustainer-network/errors");

module.exports = async query => {
  const systemInputError = findError([
    string(query.domain, { shouldAllowEmptyString: false }),
    string(query.service, { shouldAllowEmptyString: false }),
    string(query.root)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);
};
