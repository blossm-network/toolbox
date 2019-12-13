const logger = require("@blossm/logger");

const deps = require("./deps");

const common = ({ method, operation, root, data }) => {
  return {
    in: ({
      context,
      service = process.env.SERVICE,
      network = process.env.NETWORK
    }) => {
      return {
        with: async ({ path, tokenFn } = {}) => {
          const token = await deps.serviceToken({
            tokenFn,
            service,
            operation
          });
          const url = deps.serviceUrl({
            operation,
            service,
            network,
            ...(path && { path }),
            ...(root && { root })
          });
          const response = await method(url, {
            body: {
              ...(data != undefined && { ...data }),
              context
            },
            ...(token && {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
          });

          if (response.statusCode >= 300) {
            logger.info("response errored: ", { response, url });
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

module.exports = (...operation) => {
  return {
    post: data => common({ method: deps.post, operation, data }),
    put: (root, data) => common({ method: deps.put, operation, root, data }),
    delete: root => common({ method: deps.delete, operation, root }),
    get: query => {
      const root = query.root;
      delete query.root;
      return common({ method: deps.get, operation, root, data: query });
    }
  };
};
