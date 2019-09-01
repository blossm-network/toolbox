const {
  findError,
  stringArray,
  objectArray,
  object,
  string
} = require("@sustainers/validator");

const { badRequest } = require("@sustainers/errors");

module.exports = async payload => {
  const systemInputError = findError([
    stringArray(payload.audiences),
    string(payload.principle),
    objectArray(payload.scopes),
    object(payload.context)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);

  for (const scope of payload.scopes) {
    const systemScopeInputError = findError([
      string(scope.domain),
      string(scope.root),
      string(scope.priviledge)
    ]);

    if (systemScopeInputError)
      throw badRequest.message(systemScopeInputError.message);
  }
};
