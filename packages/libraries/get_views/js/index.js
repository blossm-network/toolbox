const deps = require("./deps");

module.exports = ({ id, domain, service, network }) => {
  return {
    with: ({ query, tokenFn }) => {
      return {
        in: async context =>
          await deps
            .operation(`${id}.view-store.${domain}`)
            .get({ data: query, tokenFn, context })
            .on({ service, network })
      };
    }
  };
};
