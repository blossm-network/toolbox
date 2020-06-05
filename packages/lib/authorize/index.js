const deps = require("./deps");

module.exports = async ({
  permissionsLookupFn,
  internalTokenFn,
  externalTokenFn,
  permissions = [],
  principal,
  context,
}) => {
  if (permissions == "none")
    return {
      permissions: [],
    };

  const principalPermissions = await permissionsLookupFn({
    internalTokenFn,
    externalTokenFn,
    principal,
    context,
  });

  const satisfiedPermissions = principalPermissions.filter(
    (principalPermission) => {
      for (const permission of permissions) {
        if (
          principalPermission.service == permission.service &&
          principalPermission.domain == permission.domain &&
          principalPermission.privilege == permission.privilege
        )
          return true;
      }
      return false;
    }
  );

  if (satisfiedPermissions.length == 0) {
    throw deps.invalidCredentialsError.message(
      "There are missing permissions."
    );
  }

  return {
    permissions: satisfiedPermissions,
  };
};
