const fact = require("@blossm/fact");
const eventStore = require("@blossm/event-store-rpc");
const nodeExternalToken = require("@blossm/node-external-token");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

const config = require("./config.json");

module.exports = fact({
  mainFn: main,
  ...(config.contexts && { contexts: config.contexts }),
  queryAggregatesFn: ({ context, claims, token }) => async ({
    domain,
    service,
    network,
    key,
    value,
    context: contextOverride = context,
    claims: claimsOverride = claims,
    principal = "user",
  }) => {
    const { body: aggregates } = await eventStore({
      domain,
      ...(service && { service }),
      ...(network && { network }),
    })
      .set({
        ...(contextOverride && { context: contextOverride }),
        ...(claimsOverride && { claims: claimsOverride }),
        ...(token && { currentToken: token }),
        token: {
          internalFn: gcpToken,
          externalFn: ({ network, key } = {}) =>
            principal == "user"
              ? { token, type: "Bearer" }
              : nodeExternalToken({ network, key }),
        },
      })
      .query({ key, value });

    return aggregates.map((aggregate) => ({
      root: aggregate.headers.root,
      state: aggregate.state,
    }));
  },
  aggregateFn: ({ context, claims, token }) => async (
    root,
    {
      domain = process.env.DOMAIN,
      service = process.env.SERVICE,
      network = process.env.NETWORK,
      notFoundThrows = true,
    } = {}
  ) => {
    const { body: aggregate } = await eventStore({ domain, service, network })
      .set({
        ...(context && { context }),
        ...(claims && { claims }),
        ...(token && { currentToken: token }),
        token: { internalFn: gcpToken },
      })
      .aggregate(root, { notFoundThrows });

    return (
      aggregate && {
        lastEventNumber: aggregate.headers.lastEventNumber,
        state: aggregate.state,
        root: aggregate.headers.root,
        groups: aggregate.groups,
      }
    );
  },
});
