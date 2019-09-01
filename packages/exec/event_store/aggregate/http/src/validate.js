const { findError, string } = require("@sustainers/validator");
const { badRequest } = require("@sustainers/errors");

module.exports = async params => {
  const systemInputError = findError([
    string(params.domain, { shouldAllowEmptyString: false }),
    string(params.service, { shouldAllowEmptyString: false }),
    string(params.root)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);
};
