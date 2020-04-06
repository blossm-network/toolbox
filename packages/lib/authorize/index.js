const deps = require("./deps");

module.exports = async ({ permissionsLookupFn, permissions = [], roles }) => {
  if (permissions == "none")
    return {
      permissions: []
    };

  const principlePermissions = await permissionsLookupFn({
    roles
  });

  const satisfiedPermissions = principlePermissions.filter(
    principlePermission => {
      for (const permission of permissions) {
        if (
          principlePermission.service == permission.service &&
          principlePermission.domain == permission.domain &&
          principlePermission.priviledge == permission.priviledge
        )
          return true;
      }
      return false;
    }
  );

  if (satisfiedPermissions.length == 0)
    throw deps.invalidCredentialsError.tokenInvalid();

  return {
    permissions: satisfiedPermissions
  };
};
