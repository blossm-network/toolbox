const intersection = require("@blossm/array-intersection");

const deps = require("./deps");

const WILDCARD = "*";

module.exports = async ({
  claims: { context, sub },
  permissionsLookupFn,
  priviledges = [],
  root = null,
  domain = null,
  network,
  service
}) => {
  //eslint-disable-next-line
  console.log(
    "HERE 0: ",
    context.network !== network || context.service !== service
  );
  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (context.network !== network || context.service !== service)
    throw deps.invalidCredentialsError.tokenInvalid();

  if (priviledges == "none")
    return {
      context: {
        ...context,
        permissions: [],
        ...(sub && { principle: sub })
      }
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

  //eslint-disable-next-line
  console.log("HERE 1: ", satisfiedPermissions.length == 0);
  if (satisfiedPermissions.length == 0)
    throw deps.invalidCredentialsError.tokenInvalid();

  return {
    context: {
      ...context,
      permissions: satisfiedPermissions,
      principle: sub
    }
  };
};
