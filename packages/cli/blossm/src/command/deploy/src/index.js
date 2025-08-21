import commandProcedure from "@blossm/command";
import command from "@blossm/command-rpc";
import fact from "@blossm/fact-rpc";
import eventStore from "@blossm/event-store-rpc";
import nodeExternalToken from "@blossm/node-external-token";
import gcpToken from "@blossm/gcp-token";
import gcpQueue from "@blossm/gcp-queue";
import main from "./main.js";
import validate from "./validate.js";
import fill from "./fill.js";
import normalize from "./normalize.js";
import config from "./config.json" with { type: "json" };

export default commandProcedure({
  mainFn: main,
  ...(config.contexts && { contexts: config.contexts }),
  ...(config.root && { requiresRoot: config.root }),
  ...(validate && { validateFn: validate }),
  ...(normalize && { normalizeFn: normalize }),
  ...(fill && { fillFn: fill }),
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
  commandFn: ({ path, idempotency, context, claims, token, txId, ip }) => ({
    name,
    domain,
    service,
    network,
    payload,
    root,
    options,
    context: contextOverride = context,
    claims: claimsOverride = claims,
    async = false,
    wait = 0,
    principal = "issuer",
  }) =>
    command({
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
            principal == "user" || principal == "issuer"
              ? { token, type: "Bearer" }
              : nodeExternalToken({ network }),
        },
        ...(async && { enqueue: { fn: gcpQueue.enqueue, wait } }),
      })
      .issue(payload, {
        ...(root && { root }),
        ...(options && { options }),
        headers: {
          ...(idempotency && { idempotency }),
        },
        tx: {
          ...(ip && { ip }),
          ...(txId && { id: txId }),
          ...(path && { path }),
        },
      }),
  queryAggregatesFn: ({ context, claims, token }) => async ({
    domain,
    service,
    network,
    queryPairs,
    context: contextOverride = context,
    claims: claimsOverride = claims,
    principal = "issuer",
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
            principal == "user" || principal == "issuer"
              ? { token, type: "Bearer" }
              : nodeExternalToken({ network }),
        },
      })
      .query(queryPairs);
    return aggregates.map((aggregate) => ({
      root: aggregate.headers.root,
      service: aggregate.headers.service,
      network: aggregate.headers.network,
      state: aggregate.state,
    }));
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
    fact({
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
    fact({
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
  addFn: ({ domain, service, context, claims, eventData, tx, async }) =>
    eventStore({ domain, service })
      .set({
        ...(context && { context }),
        ...(claims && { claims }),
        token: {
          internalFn: gcpToken,
        },
        ...(async && { enqueue: { fn: gcpQueue.enqueue } }),
      })
      .add({ eventData, tx }),
  countFn: ({ context, claims, token }) => ({ domain, service, root }) => {
    const {
      body: { count },
    } = eventStore({ domain, service })
      .set({
        ...(context && { context }),
        ...(claims && { claims }),
        ...(token && { currentToken: token }),
        token: {
          internalFn: gcpToken,
        },
      })
      .count(root);

    return count;
  },
});
