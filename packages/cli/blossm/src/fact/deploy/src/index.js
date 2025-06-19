import fact from "@blossm/fact";
import factRpc from "@blossm/fact-rpc";
import eventStore from "@blossm/event-store-rpc";
import nodeExternalToken from "@blossm/node-external-token";
import gcpToken from "@blossm/gcp-token";

import main from "./main.js";
import config from "./config.json";

export default fact({
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
          externalFn: ({ network } = {}) =>
            principal == "user"
              ? { token, type: "Bearer" }
              : nodeExternalToken({ network }),
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
  readFactFn: ({ context, claims, token }) => ({
    name,
    domain,
    service,
    network,
    query,
    root,
    context: contextOverride = context,
    claims: claimsOverride = claims,
    principal = "issuer",
  }) =>
    factRpc({
      name,
      ...(domain && { domain }),
      service,
      ...(network && { network }),
    })
      .set({
        ...(contextOverride && { context: contextOverride }),
        ...(claimsOverride && { claims: claimsOverride }),
        ...(token && { currentToken: token }),
        token: {
          internalFn: gcpToken,
          externalFn: ({ network } = {}) =>
            principal == "user" || principal == "issuer"
              ? { token, type: "Bearer" }
              : nodeExternalToken({ network }),
        },
      })
      .read({ query, root }),
  streamFactFn: ({ context, claims, token }) => ({
    name,
    domain,
    service,
    network,
    query,
    root,
    context: contextOverride = context,
    claims: claimsOverride = claims,
    principal = "user",
    fn,
  }) =>
    factRpc({
      name,
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
          externalFn: ({ network } = {}) =>
            principal == "user"
              ? { token, type: "Bearer" }
              : nodeExternalToken({ network }),
        },
      })
      .stream(fn, { query, root }),
});
