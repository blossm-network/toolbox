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
              `${permission.service}:${permission.domain}:${permission.priviledge}`
          ),
          state.permissions.map(
            permission =>
              `${permission.service}:${permission.domain}:${permission.priviledge}`
          )
        ).map(stringPermission => {
          const [service, domain, priviledge] = stringPermission.split(":");
          return {
            service,
            domain,
            priviledge
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
            `${permission.service}:${permission.domain}:${permission.priviledge}`
        ),
        payload.permissions.map(
          permission =>
            `${permission.service}:${permission.domain}:${permission.priviledge}`
        )
      ).map(stringPermission => {
        const [service, domain, priviledge] = stringPermission.split(":");
        return {
          priviledge,
          domain,
          service
        };
      })
    };
  }
};
