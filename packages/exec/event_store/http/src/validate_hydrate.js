const { findError, string } = require("@sustainer-network/validator");
const { badRequest } = require("@sustainer-network/errors");

module.exports = async body => {
  const systemInputError = findError([
    string(body.storeId, { shouldAllowEmptyString: false }),
    string(body.root)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);
};
