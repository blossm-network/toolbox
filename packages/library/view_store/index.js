const deps = require("./deps");

module.exports = ({ id, domain, service, network }) => {
  return {
    create: properties => {
      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation(`${id}.${domain}.view-store`)
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
                .operation(`${id}.${domain}.view-store`)
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
                .operation(`${id}.${domain}.view-store`)
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
                .operation(`${id}.${domain}.view-store`)
                .delete(root)
                .in({ context, service, network })
                .with({ tokenFn })
          };
        }
      };
    }
  };
};
