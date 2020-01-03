const intersection = require("@blossm/array-intersection");

const deps = require("./deps");

const WILDCARD = "*";

module.exports = async ({
  claims: { context, principle },
  permissionsLookupFn,
  priviledges = [],
  root = null,
  domain = null,
  network,
  service
}) => {
  //eslint-disable-next-line
  console.log("context: ", { context, network, service });
  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (context.network !== network || context.service !== service)
    throw deps.invalidCredentialsError.tokenInvalid();

  const permissions = await permissionsLookupFn({ principle, context });

  //eslint-disable-next-line
  console.log("permsss: ", { permissions });

  //eslint-disable-next-line
  console.log("privs: ", { priviledges });

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
      priviledges != undefined &&
      intersection(permissionPriviledges.split(","), priviledges).length == 0;

    return !domainViolated && !rootViolated && !priviledgesViolated;
  });

  if (satisfiedPermissions.length == 0)
    throw deps.invalidCredentialsError.tokenInvalid();

  return {
    context: {
      ...context,
      permissions: satisfiedPermissions,
      principle
    }
  };
};
