const deps = require("./deps");
const { unauthorized } = require("@sustainer-network/errors");
const intersection = require("@sustainer-network/array-intersection");

const WILDCARD = "*";

module.exports = async ({ priviledges, root, tokens, strict = true }) => {
  if (tokens.bearer == undefined) {
    if (strict) throw unauthorized.tokenInvalid;
    return {};
  }

  const data = await deps.validate({
    token: tokens.bearer,
    secret: process.env.SECRET
  });

  const { scopes, context, principle } = data;

  //Do the scopes and the context allow the provided service, network, domain, and action combo?
  if (context.network !== process.env.NETWORK) throw unauthorized.tokenInvalid;

  if (context.service !== process.env.SERVICE) throw unauthorized.tokenInvalid;

  const satisfiedScopes = scopes.filter(scope => {
    const [scopeDomain, scopeRoot, scopePriviledges] = scope.split(":");

    const domainViolated =
      scopeDomain != WILDCARD &&
      !scopeDomain.split(",").includes(process.env.DOMAIN);

    const rootViolated =
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
