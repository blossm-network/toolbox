const {
  findError,
  objectArray,
  object,
  string
} = require("@sustainer-network/validator");

const { badRequest } = require("@sustainer-network/errors");

module.exports = async params => {
  const systemInputError = findError([
    objectArray(params.payload.permissions, { optional: true }),
    object(params.payload.metadata),
    string(params.payload.account)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);

  for (const permission of params.payload.permissions) {
    const permissionsSystemInputError = findError([
      string(permission.scope),
      string(permission.domain),
      string(permission.root)
    ]);

    if (permissionsSystemInputError)
      throw badRequest.message(permissionsSystemInputError.message);
  }
};
