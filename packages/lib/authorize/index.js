const { unauthorized } = require("@sustainers/errors");
const intersection = require("@sustainers/array-intersection");

const WILDCARD = "*";

module.exports = async ({
  path,
  claims: { context, principle },
  scopesLookupFn,
  priviledgesLookupFn = null,
  root = null,
  domain = null
}) => {
  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (context.network !== process.env.NETWORK) throw unauthorized.tokenInvalid;

  if (context.service !== process.env.SERVICE) throw unauthorized.tokenInvalid;

  const [priviledges, scopes] = await Promise.all([
    priviledgesLookupFn ? priviledgesLookupFn({ path }) : null,
    scopesLookupFn({ principle })
  ]);

  const satisfiedScopes = scopes.filter(scope => {
    const [scopeDomain, scopePriviledges, scopeRoot] = scope.split(":");

    const domainViolated =
      scopeDomain != WILDCARD &&
      domain != undefined &&
      !scopeDomain.split(",").includes(domain);

    const rootViolated =
      scopeRoot != undefined &&
      scopeRoot != WILDCARD &&
      root != undefined &&
      !scopeRoot.split(",").includes(root);

    const priviledgesViolated =
      scopePriviledges != WILDCARD &&
      priviledges != undefined &&
      intersection(scopePriviledges.split(","), priviledges).length == 0;

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
