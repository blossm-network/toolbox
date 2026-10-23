import deps from "./deps.js";

export default ({storeQueries, region = process.env.GCP_REGION }) => {
  const stream = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (fn, sortFn) =>
    deps
      .stream({
        region,
        operationNameComponentQueries: storeQueries.map(({ domain, service = process.env.SERVICE, query = {} }) => ({
          operationNameComponents: [domain, service, "event-store"],
          query,
        })),
        fn,
        sortFn,
      })
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/stream-aggregates`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
      });

  return {
    set: ({ context, claims, token } = {}) => {
      return {
        stream: stream({ context, claims, token }),
      };
    },
    stream: stream(),
  };
};
