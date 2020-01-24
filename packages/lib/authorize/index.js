const intersection = require("@blossm/array-intersection");

const deps = require("./deps");

const WILDCARD = "*";

module.exports = async ({
  session: { sub },
  context,
  permissionsLookupFn,
  priviledges = [],
  root = null,
  domain = null,
  network,
  service
}) => {
  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (context.network !== network || context.service !== service)
    throw deps.invalidCredentialsError.tokenInvalid();

  if (priviledges == "none")
    return {
      permissions: [],
      ...(sub && { principle: sub })
    };

  const permissions = await permissionsLookupFn({ principle: sub, context });

  const satisfiedPermissions = permissions.filter(permission => {
    const [
      permissionDomain,
      permissionPriviledges,
      permissionRoot
    ] = permission.split(":");

    const domainViolated =
      permissionDomain != WILDCARD &&
      domain != undefined &&
      !permissionDomain.split(",").includes(domain);

    const rootViolated =
      permissionRoot != undefined &&
      permissionRoot != WILDCARD &&
      root != undefined &&
      !permissionRoot.split(",").includes(root);

    const priviledgesViolated =
      permissionPriviledges != WILDCARD &&
      intersection(permissionPriviledges.split(","), priviledges).length == 0;

    return !domainViolated && !rootViolated && !priviledgesViolated;
  });

  if (satisfiedPermissions.length == 0)
    throw deps.invalidCredentialsError.tokenInvalid();

  return {
    permissions: satisfiedPermissions,
    principle: sub
  };
};
