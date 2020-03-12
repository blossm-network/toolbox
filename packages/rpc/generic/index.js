const logger = require("@blossm/logger");

const deps = require("./deps");

const common = ({ method, dataParam, procedure, root, data }) => {
  return {
    in: ({ context, network = process.env.NETWORK }) => {
      return {
        with: async ({ path, tokenFn, claims } = {}) => {
          const token = await deps.operationToken({
            tokenFn,
            procedure
          });

          const url = deps.operationUrl({
            procedure,
            network,
            ...(path && { path }),
            ...(root && { root })
          });

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

          return JSON.parse(response.body);
        }
      };
    }
  };
};

module.exports = (...procedure) => {
  return {
    post: data =>
      common({ method: deps.post, dataParam: "body", procedure, data }),
    put: (root, data) =>
      common({ method: deps.put, dataParam: "body", procedure, root, data }),
    delete: root =>
      common({ method: deps.delete, dataParam: "body", procedure, root }),
    get: query => {
      const root = query.root;
      delete query.root;
      return common({
        method: deps.get,
        dataParam: "query",
        procedure,
        root,
        data: query
      });
    }
  };
};
