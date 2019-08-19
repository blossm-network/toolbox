const { findError, string } = require("@sustainer-network/validator");
const { badRequest } = require("@sustainer-network/errors");

module.exports = async query => {
  const systemInputError = findError([
    string(query.storeId, { shouldAllowEmptyString: false }),
    string(query.root)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);
};
