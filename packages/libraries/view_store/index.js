const deps = require("./deps");

module.exports = ({ id, domain, service, network }) => {
  return {
    create: properties => {
      return {
        in: context => {
          return {
            with: async tokenFn =>
              await deps
                .operation("view-store")
                .post(properties)
                .in({ context, service, network })
                .with({ path: `/${domain}/${id}`, tokenFn })
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
                .operation("view-store")
                .get(query)
                .in({ context, service, network })
                .with({ path: `/${domain}/${id}`, tokenFn })
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
                .operation("view-store")
                .put(root, properties)
                .in({ context, service, network })
                .with({ path: `/${domain}/${id}`, tokenFn })
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
                .operation("view-store")
                .delete(root)
                .in({ context, service, network })
                .with({ path: `/${domain}/${id}`, tokenFn })
          };
        }
      };
    }
  };
};
