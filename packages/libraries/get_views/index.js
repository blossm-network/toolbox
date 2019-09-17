const deps = require("./deps");

module.exports = ({ id, domain, service, network }) => {
  return {
    for: query => {
      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation(`${id}.view-store.${domain}`)
                .get(query)
                .in({ context, service, network })
                .with({ tokenFn })
          };
        }
      };
    }
  };
};
