const difference = require("@blossm/array-difference");
module.exports = {
  "add-roles": (state, payload) => {
    state.roles = state.roles || [];
    return {
      ...state,
      ...payload,
      roles: state.roles.concat(
        difference(
          payload.roles.map(
            role => `${role.id}:${role.service}:${role.network}`
          ),
          state.roles.map(role => `${role.id}:${role.service}:${role.network}`)
        ).map(stringRole => {
          const [id, service, network] = stringRole.split(":");
          return {
            id,
            service,
            network
          };
        })
      )
    };
  },
  "remove-roles": (state, payload) => {
    return {
      ...state,
      ...payload,
      roles: difference(
        state.roles.map(role => `${role.id}:${role.service}:${role.network}`),
        payload.roles.map(role => `${role.id}:${role.service}:${role.network}`)
      ).map(stringRole => {
        const [id, service, network] = stringRole.split(":");
        return {
          id,
          service,
          network
        };
      })
    };
  },
  "add-contexts": (state, payload) => {
    state.contexts = state.contexts || [];
    return {
      ...state,
      ...payload,
      contexts: state.contexts.concat(
        difference(
          payload.contexts.map(
            context => `${context.root}:${context.service}:${context.network}`
          ),
          state.contexts.map(
            context => `${context.root}:${context.service}:${context.network}`
          )
        ).map(stringContext => {
          const [root, service, network] = stringContext.split(":");
          return {
            root,
            service,
            network
          };
        })
      )
    };
  },
  "remove-contexts": (state, payload) => {
    return {
      ...state,
      ...payload,
      contexts: difference(
        state.contexts.map(
          context => `${context.root}:${context.service}:${context.network}`
        ),
        payload.contexts.map(
          context => `${context.root}:${context.service}:${context.network}`
        )
      ).map(stringContext => {
        const [root, service, network] = stringContext.split(":");
        return {
          root,
          service,
          network
        };
      })
    };
  }
};
