const logger = require("@blossm/logger");

const deps = require("./deps");

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
    } else if (char == "}") {
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
  return { parsedData, leftover: string.substr(objectCloseIndex) };
};

const common = ({ method, dataParam, operation, id, data }) => {
  return {
    in: ({ context, network, host = process.env.HOST }) => {
      return {
        with: async ({
          path,
          internalTokenFn,
          externalTokenFn,
          currentToken,
          key,
          claims,
          enqueueFn,
        } = {}) => {
          const internal = host == process.env.HOST;

          //TODO
          //eslint-disable-next-line no-console
          console.log({
            path,
            data,
            id,
            context,
            network,
            host,
          });
          const { token, type } =
            (internal
              ? await deps.operationToken({
                  tokenFn: internalTokenFn,
                  operation,
                })
              : await deps.networkToken({
                  tokenFn: externalTokenFn,
                  network,
                  key,
                })) || {};

          const url = internal
            ? deps.operationUrl({
                operation,
                host,
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
                  operation,
                  method:
                    method == deps.post
                      ? "post"
                      : method == deps.put
                      ? "put"
                      : method == deps.delete
                      ? "delete"
                      : null,
                })
              : await method(url, {
                  [dataParam]: requestData,
                  ...(token && {
                    headers: {
                      authorization: `${type} ${token}`,
                    },
                  }),
                });

          //Stream doesn't have a reponse.
          if (!response) return;

          if (response.statusCode >= 300) {
            logger.info("response errored: ", {
              response,
              url,
              data,
              context,
              network,
              token,
            });
            const {
              parsedData: [parsedBody],
            } = response.body ? jsonString(response.body) : null;
            throw deps.constructError({
              statusCode: response.statusCode,
              message: (parsedBody && parsedBody.message) || "Not specified",
              ...(parsedBody && parsedBody.info && { info: parsedBody.info }),
              ...(parsedBody && parsedBody.code && { code: parsedBody.code }),
            });
          }

          //If the enqueuing was skipped because of local env, dont return.
          return shouldEnqueue && process.env.NODE_ENV == "local"
            ? {}
            : {
                ...(response.body && { body: formatResponse(response.body) }),
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

module.exports = (...operation) => {
  return {
    post: (data) =>
      common({
        method: deps.post,
        dataParam: "body",
        operation,
        data,
      }),
    put: (id, data) =>
      common({ method: deps.put, dataParam: "body", operation, id, data }),
    delete: (id) =>
      common({ method: deps.delete, dataParam: "body", operation, id }),
    get: (query) => {
      const id = query.id;
      delete query.id;
      return common({
        method: deps.get,
        dataParam: "query",
        operation,
        id,
        data: query,
      });
    },
    stream: (fn, query) => {
      const id = query.id;
      delete query.id;
      let progress = "";
      return common({
        method: (url, data) =>
          deps.stream(
            url,
            async (data) => {
              const string = data.toString();
              let { parsedData, leftover } = jsonString(progress + string);
              for (const d of parsedData) await fn(d);
              progress = leftover;
            },
            data
          ),
        dataParam: "query",
        operation,
        id,
        data: query,
      });
    },
  };
};
