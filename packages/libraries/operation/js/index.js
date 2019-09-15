const request = require("@sustainers/request");

module.exports = operation => {
  return {
    post: ({ data, context, tokenFn }) => {
      return {
        on: async ({ service, network }) => {
          const url = `https://${operation}.${service}.${network}`;
          return await request.post(
            url,
            {
              ...data,
              context
            },
            {
              Authorization: `Bearer ${await tokenFn({ operation })}`
            }
          );
        }
      };
    },
    get: ({ data, context, tokenFn }) => {
      return {
        on: async ({ service, network }) => {
          const url = `https://${operation}.${service}.${network}`;
          return await request.get(url, {
            ...data,
            context,
            access_token: await tokenFn({ operation })
          });
        }
      };
    }
  };
};
