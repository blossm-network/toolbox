const request = require("@sustainers/request");
const logger = require("@sustainers/logger");

module.exports = operation => {
  return {
    post: ({ data, context, tokenFn }) => {
      return {
        on: async ({ service, network }) => {
          const url = `https://${operation}.${service}.${network}`;
          logger.info("toke: ", {
            token: await tokenFn({ url })
          });
          const headers = {
            Authorization: `Bearer ${await tokenFn({ url })}`
          };
          return await request.post(
            url,
            {
              ...data,
              context
            },
            headers
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
            access_token: await tokenFn({ url })
          });
        }
      };
    }
  };
};
