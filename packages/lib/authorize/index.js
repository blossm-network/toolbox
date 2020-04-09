const deps = require("./deps");

module.exports = async ({
  permissionsLookupFn,
  permissions = [],
  principle,
  context
}) => {
  if (permissions == "none")
    return {
      permissions: []
    };

  const principlePermissions = await permissionsLookupFn({
    principle,
    context
  });

  //TODO
  //eslint-disable-next-line no-console
  console.log("PERMISSIONS: ", {
    permissions,
    principlePermissions,
    principle
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

  if (satisfiedPermissions.length == 0) {
    //TODO
    //eslint-disable-next-line no-console
    console.log("PERMISSIONS BAD: ", { principle });
    throw deps.invalidCredentialsError.tokenInvalid();
  }

  return {
    permissions: satisfiedPermissions
  };
};
