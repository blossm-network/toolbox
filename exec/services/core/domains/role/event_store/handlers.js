const difference = require("@blossm/array-difference");

module.exports = {
  create: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  "add-permissions": (state, payload) => {
    state.permissions = state.permissions || [];
    return {
      ...state,
      permissions: state.permissions.concat(
        difference(
          payload.permissions.map(
            permission =>
              `${permission.root}:${permission.service}:${permission.network}`
          ),
          state.permissions.map(
            permission =>
              `${permission.root}:${permission.service}:${permission.network}`
          )
        ).map(stringPermission => {
          const [root, service, network] = stringPermission.split(":");
          return {
            root,
            service,
            network
          };
        })
      )
    };
  },
  "remove-permissions": (state, payload) => {
    return {
      ...state,
      permissions: difference(
        state.permissions.map(
          permission =>
            `${permission.root}:${permission.service}:${permission.network}`
        ),
        payload.permissions.map(
          permission =>
            `${permission.root}:${permission.service}:${permission.network}`
        )
      ).map(stringPermission => {
        const [root, service, network] = stringPermission.split(":");
        return {
          root,
          service,
          network
        };
      })
    };
  }
};
