import logger from "@blossm/logger";

import deps from "./deps.js";

const formatResponse = (data) => {
  try {
    const formattedResponse = JSON.parse(data);
    return formattedResponse;
  } catch (e) {
    return data;
  }
};

const common = ({ method, dataParam, region, operationNameComponents, id, data, raw, onDataFn }) => {
  return {
    in: ({ context, network, host = process.env.HOST }) => {
      return {
        with: async ({
          path,
          internalTokenFn,
          externalTokenFn,
          currentToken,
          claims,
          enqueueFn,
        } = {}) => {
          const internal = host == process.env.HOST;

          let token, type, url;

          if (internal) {
            const hash = deps.hash(...operationNameComponents);

            const { token: _token, type: _type } = await deps.operationToken({
              tokenFn: internalTokenFn,
              operationNameComponents,
              hash
            }) || {};
            token = _token;
            type = _type;

            url = deps.operationUrl({
                protocol: process.env.NODE_ENV == "local" ? "http" : "https",
                host: process.env.NODE_ENV == "local" ? `${hash}.${host}` : `${region}-${deps.operationShortName(operationNameComponents)}-${hash}-${process.env.GCP_COMPUTE_URL_ID}.${region}.run.app`,
                ...(path && { path }),
                ...(id && { id }),
              });
          } else {
            const { token: _token, type: _type } = await deps.networkToken({
                  tokenFn: externalTokenFn,
                  network,
                });

            token = _token;
            type = _type;
            
            url = deps.networkUrl({
                host,
                ...(path && { path }),
                ...(id && { id }),
              });
          }
            
          const requestData = {
            ...(data && { ...data }),
            ...(internal && {
              ...(context && { context }),
              ...(claims && { claims }),
              ...(currentToken && { token: currentToken }),
            }),
          };

          const shouldEnqueue = enqueueFn && method != deps.get;

          const response =
            shouldEnqueue && process.env.NODE_ENV != "local"
              ? await deps.enqueueOperation({
                  enqueueFn,
                  url,
                  data: requestData,
                  method:
                    method == deps.post
                      ? "post"
                      : method == deps.put
                      ? "put"
                      : method == deps.del
                      ? "del"
                      : null,
                })
              : await method(url, {
                  [dataParam]: requestData,
                  ...(token && {
                    headers: {
                      authorization: `${type} ${token}`,
                    },
                  }),
                  ...(onDataFn && { onDataFn }),
                });

          //Stream doesn't have a reponse.
          if (!response) return;

          if (response.statusCode >= 300) {
            logger.info("response errored: ", {
              response,
              url,
              data: requestData,
              context,
              network,
              token,
            });
            const parsedBody = formatResponse(response.body);
            throw deps.constructError({
              statusCode: response.statusCode,
              message: (parsedBody && parsedBody.message) || "Not specified",
              info: {
                ...(parsedBody && parsedBody.info),
                url,
                data: requestData,
                context,
                network,
                token,
              },
              ...(parsedBody && parsedBody.code && { code: parsedBody.code }),
            });
          }

          //If the enqueuing was skipped because of local env, dont return.
          return shouldEnqueue && process.env.NODE_ENV == "local"
            ? {}
            : {
                ...(response.body && {
                  body: raw ? response.body : formatResponse(response.body),
                }),
                ...(response.headers && {
                  headers: formatResponse(response.headers),
                }),
                statusCode: response.statusCode,
              };
        },
      };
    },
  };
};

export default ({region, operationNameComponents}) => ({
  post: (data) =>
    common({
      method: deps.post,
      dataParam: "body",
      region,
      operationNameComponents,
      data,
    }),
  put: (id, data) =>
    common({ method: deps.put, dataParam: "body", region, operationNameComponents, id, data }),
  del: (id, data) =>
    common({
      method: deps.del,
      dataParam: "query",
      region,
      operationNameComponents,
      id,
      data,
    }),
  get: ({ id, ...query } = {}, { raw } = {}) => {
    return common({
      method: deps.get,
      dataParam: "query",
      region,
      operationNameComponents,
      id,
      data: query,
      raw,
    });
  },
  stream: (fn, { id, ...query } = {}, { raw, onResponseFn, signal, timeout } = {}) => {
    const decoder = raw ? null : deps.jsonDecoder();
    return common({
      method: async (url, data) => {
        const response = await deps.stream(
          url,
          async (data) => {
            if (raw) return await fn(data);
            for (const value of decoder.write(data)) await fn(value);
          },
          {
            ...data,
            ...(onResponseFn && { onResponseFn }),
            ...(signal && { signal }),
            ...(timeout !== undefined && { timeout }),
          }
        );
        if (decoder) for (const value of decoder.end()) await fn(value);
        return response;
      },
      dataParam: "query",
      region,
      operationNameComponents,
      id,
      data: query,
    });
  },
});
