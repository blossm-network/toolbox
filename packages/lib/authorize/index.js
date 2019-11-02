const { unauthorized } = require("@sustainers/errors");
const intersection = require("@sustainers/array-intersection");

const WILDCARD = "*";

module.exports = async ({
  path,
  claims: { context, principle },
  scopesLookupFn,
  priviledgesLookupFn = null,
  root = null,
  domain = null,
  network,
  service
}) => {
  //eslint-disable-next-line no-console
  console.log("IN AUTHOR LIB tokens: ", {
    path,
    context,
    principle,
    root,
    domain
  });

  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (context.network !== network || context.service !== service)
    throw unauthorized.tokenInvalid;

  //priviledges lookup fn returns the priviledges that the path needs.
  //scopes lookup fn returns the scopes that the principle has.
  const [priviledges, scopes] = await Promise.all([
    priviledgesLookupFn ? priviledgesLookupFn({ path }) : null,
    scopesLookupFn({ principle })
  ]);

  //eslint-disable-next-line no-console
  console.log("IN AUTHOR LIB fns: ", {
    priviledges,
    scopes
  });

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

  //eslint-disable-next-line no-console
  console.log("Satisfied scopes: ", {
    satisfiedScopes
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
