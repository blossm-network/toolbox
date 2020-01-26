const intersection = require("@blossm/array-intersection");

const deps = require("./deps");

const WILDCARD = "*";

module.exports = async ({
  session: { sub },
  context,
  permissionsLookupFn,
  permissions = [],
  root = null,
  domain = null,
  network,
  service
}) => {
  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (context.network !== network || context.service !== service)
    throw deps.invalidCredentialsError.tokenInvalid();

  if (permissions == "none")
    return {
      permissions: [],
      ...(sub && { principle: sub })
    };

  const principlePermissions = await permissionsLookupFn({
    principle: sub,
    context
  });

  const satisfiedPermissions = principlePermissions.filter(
    principlePermission => {
      const [
        principlePermissionDomain,
        principlePermissionPriviledges,
        principlePermissionRoot
      ] = principlePermission.split(":");

      for (const permission of permissions) {
        const permissionComponents = permission.split(":");

        const permissionDomain =
          permissionComponents.length > 1 ? permissionComponents[0] : domain;

        const domainViolated =
          principlePermissionDomain != WILDCARD &&
          permissionDomain != undefined &&
          !principlePermissionDomain == permissionDomain;

        let permissionRoot =
          permissionComponents.length > 2 ? permissionComponents[2] : root;

        if (permissionRoot.startsWith("$")) {
          const key = permissionRoot.substring(1);
          if (!context[key]) continue;
          permissionRoot = context[key];
        }

        const rootViolated =
          principlePermissionRoot != undefined &&
          principlePermissionRoot != WILDCARD &&
          permissionRoot != undefined &&
          !principlePermissionRoot.split(",").includes(permissionRoot);

        const permissionPriviledges =
          permissionComponents.length == 1
            ? permissionComponents[0]
            : permissionComponents[1];

        const priviledgesViolated =
          principlePermissionPriviledges != WILDCARD &&
          intersection(
            principlePermissionPriviledges.split(","),
            permissionPriviledges.split(",")
          ).length == 0;

        if (!domainViolated && !rootViolated && !priviledgesViolated)
          return true;
      }
      return false;
    }
  );

  if (satisfiedPermissions.length == 0)
    throw deps.invalidCredentialsError.tokenInvalid();

  return {
    permissions: satisfiedPermissions,
    principle: sub
  };
};
