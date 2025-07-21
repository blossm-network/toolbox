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

const jsonString = (string) => {
  let objectOpenIndex;
  let objectCloseIndex;
  let openCount = 0;
  const parsedData = [];
  for (let i = 0; i < string.length; i++) {
    const char = string.charAt(i);
    if (char == "{") {
      if (objectOpenIndex == undefined) objectOpenIndex = i;
      openCount++;
    } else if (char == "}" && openCount > 0) {
      openCount--;
      if (openCount == 0) {
        parsedData.push(
          JSON.parse(string.substr(objectOpenIndex, i - objectOpenIndex + 1))
        );
        objectOpenIndex = null;
        objectCloseIndex = i + 1;
      }
    }
  }
  return {
    parsedData,
    leftover: objectCloseIndex ? string.substr(objectCloseIndex) : "",
  };
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

          const { token, type } =
            (internal
              ? await deps.operationToken({
                  tokenFn: internalTokenFn,
                  operationNameComponents,
                })
              : await deps.networkToken({
                  tokenFn: externalTokenFn,
                  network,
                })) || {};

          const url = internal
            ? deps.operationUrl({
                region, 
                operationNameComponents,
                host,
                computeUrlId: process.env.GCP_COMPUTE_URL_ID, 
                ...(path && { path }),
                ...(id && { id }),
              })
            : deps.networkUrl({
                host,
                ...(path && { path }),
                ...(id && { id }),
              });

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
            //don't enqueue if on local
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
            const {
              parsedData: [parsedBody],
            } = response.body ? jsonString(response.body) : { parsedData: [] };
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
  get: (query, { raw } = {}) => {
    const id = query.id;
    delete query.id;
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
  stream: (fn, query, { raw } = {}) => {
    const id = query.id;
    delete query.id;
    let progress = "";
    return common({
      method: async (url, data) => {
        return await deps.stream(
          url,
          async (data) => {
            if (raw) return await fn(data);
            const string = data.toString();
            let { parsedData, leftover } = jsonString(progress + string);
            progress = leftover;
            for (const d of parsedData) await fn(d);
          },
          data
        );
      },
      dataParam: "query",
      region,
      operationNameComponents,
      id,
      data: query,
    });
  },
});
