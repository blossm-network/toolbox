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
          claims,
          enqueueFn,
        } = {}) => {
          const internal = host == process.env.HOST;

          const { token, type } =
            (internal
              ? await deps.operationToken({
                  tokenFn: internalTokenFn,
                  operation,
                })
              : await deps.networkToken({
                  tokenFn: externalTokenFn,
                  network,
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
    delete: (id, data) =>
      common({
        method: deps.delete,
        dataParam: "query",
        operation,
        id,
        data,
      }),
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
    stream: (fn, query, { raw, onResponseFn } = {}) => {
      const id = query.id;
      delete query.id;
      let progress = "";
      return common({
        method: async (url, data) => {
          let sendRaw;
          return await deps.stream(
            url,
            async (data) => {
              if (raw) return await fn(data);
              const string = data.toString();
              let { parsedData, leftover } = jsonString(progress + string);
              progress = leftover;
              for (const d of parsedData) await fn(d);
            },
            {
              ...data,
              onResponseFn: (response) => {
                onResponseFn && onResponseFn(response);
                sendRaw =
                  response.headers["Content-Type"] &&
                  !response.headers["Content-Type"].startsWith(
                    "application/json"
                  );
                //TODO
                console.log({ sendRaw });
              },
            }
          );
        },
        dataParam: "query",
        operation,
        id,
        data: query,
      });
    },
  };
};
