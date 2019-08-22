const {
  findError,
  objectArray,
  object,
  string
} = require("@sustainer-network/validator");

const { badRequest } = require("@sustainer-network/errors");

module.exports = async body => {
  const systemInputError = findError([
    objectArray(body.payload.permissions, { optional: true }),
    object(body.payload.metadata),
    string(body.payload.account)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);

  for (const permission of body.payload.permissions) {
    const permissionsSystemInputError = findError([
      string(permission.scope),
      string(permission.domain),
      string(permission.root)
    ]);

    if (permissionsSystemInputError)
      throw badRequest.message(permissionsSystemInputError.message);
  }
};
