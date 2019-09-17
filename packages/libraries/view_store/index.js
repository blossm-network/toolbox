const deps = require("./deps");

module.exports = ({ id, domain, service, network }) => {
  return {
    create: properties => {
      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation(`${id}.view-store.${domain}`)
                .post(properties)
                .in({ context, service, network })
                .with({ tokenFn })
          };
        }
      };
    },
    read: query => {
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
    },
    update: (root, properties) => {
      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation(`${id}.view-store.${domain}`)
                .put(root, properties)
                .in({ context, service, network })
                .with({ tokenFn })
          };
        }
      };
    },
    delete: root => {
      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation(`${id}.view-store.${domain}`)
                .delete(root)
                .in({ context, service, network })
                .with({ tokenFn })
          };
        }
      };
    }
  };
};
