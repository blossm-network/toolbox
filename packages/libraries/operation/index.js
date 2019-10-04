const request = require("@sustainers/request");
const errors = require("@sustainers/errors");

const common = ({ method, operation, root, data }) => {
  return {
    in: ({ context, service, network }) => {
      return {
        with: async ({ path = "", tokenFn } = {}) => {
          const url = `http://${operation}.${service}.${network}${path}${
            root != undefined ? `/${root}` : ""
          }`;
          const token = tokenFn ? await tokenFn({ operation }) : null;

          const response = await method(
            url,
            {
              ...(data != undefined && { ...data }),
              context
            },
            token
              ? {
                Authorization: `Bearer ${token}`
              }
              : undefined
          );

          //eslint-disable-next-line no-console
          console.log("res is: ", response);
          if (response.statusCode >= 300) {
            throw errors.construct({
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

module.exports = operation => {
  return {
    post: data => common({ method: request.post, operation, data }),
    put: (root, data) => common({ method: request.put, operation, root, data }),
    delete: root => common({ method: request.delete, operation, root }),
    get: query => {
      const root = query.root;
      delete query.root;
      return common({ method: request.get, operation, root, data: query });
    }
  };
};
