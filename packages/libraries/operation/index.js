const request = require("@sustainers/request");

const common = ({ method, operation, root, data }) => {
  return {
    in: ({ context, service, network }) => {
      return {
        with: async ({ path = "", tokenFn }) => {
          const url = `https://${operation}.${service}.${network}${path}${
            root != undefined ? `/${root}` : ""
          }`;
          return await method(
            url,
            {
              ...(data != undefined && { ...data }),
              context
            },
            {
              Authorization: `Bearer ${await tokenFn({ operation })}`
            }
          );
        }
      };
    }
  };
};

module.exports = operation => {
  return {
    post: data => common({ method: request.post, operation, data }),
    put: (root, data) => common({ method: request.put, operation, root, data }),
    delete: root => common({ method: request.delete, operation, root }),
    get: query => common({ method: request.get, operation, data: query })
  };
};
