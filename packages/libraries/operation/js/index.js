const request = require("@sustainers/request");

module.exports = operation => {
  return {
    post: async ({ data, context }) =>
      await request.post(
        `https://${operation}.${process.env.SERVICE}.${process.env.NETWORK}`,
        {
          ...data,
          context
        }
      ),
    get: async ({ data, context }) =>
      await request.get(
        `https://${operation}.${process.env.SERVICE}.${process.env.NETWORK}`,
        {
          ...data,
          context
        }
      )
  };
};
