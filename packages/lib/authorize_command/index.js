const deps = require("./deps");
const { unauthorized } = require("@sustainer-network/errors");
const intersection = require("@sustainer-network/array-intersection");

const WILDCARD = "*";

module.exports = async ({
  requirements: { network, service, domain, priviledges, root },
  tokens
}) => {
  if (tokens.bearer == undefined) throw unauthorized.tokenInvalid;

  const { scopes, context, principle } = await deps.validate({
    token: tokens.bearer,
    secret: process.env.SECRET
  });

  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (network != undefined && context.network !== network)
    throw unauthorized.tokenInvalid;

  if (service != undefined && context.service !== service)
    throw unauthorized.tokenInvalid;

  const satisfiedScopes = scopes.filter(scope => {
    const [scopeDomain, scopeRoot, scopePriviledges] = scope.split(":");

    const domainViolated =
      scopeDomain != WILDCARD &&
      domain != undefined &&
      !scopeDomain.split(",").includes(domain);

    const rootViolated =
      scopeRoot != WILDCARD &&
      root != undefined &&
      !scopeRoot.split(",").includes(root);

    const priviledgesViolated =
      scopePriviledges != WILDCARD &&
      priviledges != undefined &&
      intersection(scopeRoot.split(","), priviledges).length == 0;

    return !domainViolated && !rootViolated && !priviledgesViolated;
  });

  if (satisfiedScopes.length == 0) throw unauthorized.tokenInvalid;

  return {
    context: {
      ...context,
      scopes: satisfiedScopes,
      principle
    }
  };
};
