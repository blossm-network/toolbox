const {
  findError,
  stringArray,
  objectArray,
  object,
  string
} = require("@sustainer-network/validator");

const { badRequest } = require("@sustainer-network/errors");

module.exports = async params => {
  const systemInputError = findError([
    stringArray(params.audiences),
    string(params.principle),
    objectArray(params.scopes),
    object(params.context)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);

  for (const scope of params.scopes) {
    const systemScopeInputError = findError([
      string(scope.domain),
      string(scope.root),
      string(scope.priviledge)
    ]);

    if (systemScopeInputError)
      throw badRequest.message(systemScopeInputError.message);
  }
};
