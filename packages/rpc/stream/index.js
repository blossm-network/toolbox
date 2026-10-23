import deps from "./deps.js";

export default ({
  region = process.env.GCP_REGION,
  operationNameComponentQueries,
  fn,
  sortFn,
}) => ({
  in: ({ context, network, host = process.env.HOST }) => ({
    with: async ({
      path,
      internalTokenFn,
      externalTokenFn,
      currentToken,
      claims,
      signal,
      timeout,
    } = {}) => {
      const internal = host == process.env.HOST;
      const requests = [];
      for (const {
        operationNameComponents,
        query: { id, ...query } = {},
      } of operationNameComponentQueries) {
        let identity, url;
        if (internal) {
          const hash = deps.hash(...operationNameComponents);
          identity = await deps.operationToken({
            tokenFn: internalTokenFn,
            operationNameComponents,
            hash,
          });
          url = deps.operationUrl({
            protocol: process.env.NODE_ENV == "local" ? "http" : "https",
            host:
              process.env.NODE_ENV == "local"
                ? `${hash}.${host}`
                : `${region}-${deps.operationShortName(
                    operationNameComponents
                  )}-${hash}-${
                    process.env.GCP_COMPUTE_URL_ID
                  }.${region}.run.app`,
            ...(path && { path }),
            ...(id && { id }),
          });
        } else {
          identity = await deps.networkToken({
            tokenFn: externalTokenFn,
            network,
          });
          url = deps.networkUrl({
            host,
            ...(path && { path }),
            ...(id && { id }),
          });
        }
        requests.push({
          url,
          query: {
            ...query,
            ...(internal && {
              ...(context && { context }),
              ...(claims && { claims }),
              ...(currentToken && { token: currentToken }),
            }),
          },
          ...(identity?.token && {
            headers: { authorization: `${identity.type} ${identity.token}` },
          }),
        });
      }
      return deps.streamMany(requests, fn, sortFn, {
        decode: deps.jsonDecoder,
        ...(signal && { signal }),
        ...(timeout !== undefined && { timeout }),
      });
    },
  }),
});
