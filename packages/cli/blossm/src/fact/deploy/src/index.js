const fact = require("@blossm/fact");
const eventStore = require("@blossm/event-store-rpc");
const nodeExternalToken = require("@blossm/node-external-token");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

module.exports = fact({
  mainFn: main,
  queryAggregatesFn: ({ context, claims, token }) => ({
    domain,
    service,
    network,
    key,
    value,
    context: contextOverride = context,
    claims: claimsOverride = claims,
    principal = "user",
  }) =>
    eventStore({
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
      .query({ key, value }),
});
