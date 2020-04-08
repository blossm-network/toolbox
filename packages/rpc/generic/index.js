const logger = require("@blossm/logger");

const deps = require("./deps");

const formatResponse = response => {
  try {
    const formattedResponse = JSON.parse(response);
    return formattedResponse;
  } catch (e) {
    return response;
  }
};

const common = ({ method, dataParam, operation, id, data }) => {
  return {
    in: ({ context, network, host = process.env.HOST }) => {
      return {
        with: async ({
          path,
          internalTokenFn,
          externalTokenFn,
          claims
        } = {}) => {
          //TODO
          //eslint-disable-next-line no-console
          console.log({ operation, host, network, context });
          const internal = host == process.env.HOST;
          //TODO
          //eslint-disable-next-line no-console
          console.log({ internal, internalTokenFn, externalTokenFn });

          const token = internal
            ? await deps.operationToken({
                tokenFn: internalTokenFn,
                operation
              })
            : await deps.networkToken({
                tokenFn: externalTokenFn,
                network
              });

          //TODO
          //eslint-disable-next-line no-console
          console.log({ tokenRpc: token });
          const url = internal
            ? deps.operationUrl({
                operation,
                host,
                ...(path && { path }),
                ...(id && { id })
              })
            : deps.networkUrl({
                host,
                ...(path && { path }),
                ...(id && { id })
              });

          //TODO
          //eslint-disable-next-line no-console
          console.log({ url });
          const response = await method(url, {
            [dataParam]: {
              ...(data && { ...data }),
              ...(context && { context }),
              ...(claims && { claims })
            },
            ...(token && {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
          });

          if (response.statusCode >= 300) {
            logger.info("response errored: ", {
              response,
              url,
              data,
              context,
              network,
              token
            });
            throw deps.constructError({
              statusCode: response.statusCode,
              message: response.body
                ? JSON.parse(response.body).message || "Not specified"
                : null
            });
          }
          if (response.statusCode == 204) return null;

          return formatResponse(response.body);
        }
      };
    }
  };
};

module.exports = (...operation) => {
  return {
    post: data =>
      common({
        method: deps.post,
        dataParam: "body",
        operation,
        data
      }),
    put: (id, data) =>
      common({ method: deps.put, dataParam: "body", operation, id, data }),
    delete: id =>
      common({ method: deps.delete, dataParam: "body", operation, id }),
    get: query => {
      const id = query.id;
      delete query.id;
      return common({
        method: deps.get,
        dataParam: "query",
        operation,
        id,
        data: query
      });
    }
  };
};
