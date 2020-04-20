const deps = require("./deps");

module.exports = async ({
  permissionsLookupFn,
  permissions = [],
  principle,
  context,
}) => {
  if (permissions == "none")
    return {
      permissions: [],
    };

  const principlePermissions = await permissionsLookupFn({
    principle,
    context,
  });

  const satisfiedPermissions = principlePermissions.filter(
    (principlePermission) => {
      for (const permission of permissions) {
        if (
          principlePermission.service == permission.service &&
          principlePermission.domain == permission.domain &&
          principlePermission.privilege == permission.privilege
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
