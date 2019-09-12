const request = require("@sustainers/request");

module.exports = operation => {
  return {
    post: ({ data, context }) => {
      return {
        on: async ({ service, network }) =>
          await request.post(`https://${operation}.${service}.${network}`, {
            ...data,
            context
          })
      };
    },
    get: ({ data, context }) => {
      return {
        on: async ({ service, network }) =>
          await request.get(`https://${operation}.${service}.${network}`, {
            ...data,
            context
          })
      };
    }
  };
};
