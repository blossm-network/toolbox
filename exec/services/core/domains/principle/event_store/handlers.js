const difference = require("@blossm/array-difference");
module.exports = {
  "add-roles": (state, payload) => {
    return {
      ...state,
      ...payload,
      roles: (state.roles || []).concat(difference(payload.roles, state.roles))
    };
  },
  "remove-roles": (state, payload) => {
    return {
      ...state,
      ...payload,
      roles: difference(state.roles, payload.roles)
    };
  },
  "add-contexts": (state, payload) => {
    return {
      ...state,
      ...payload,
      contexts: (state.contexts || []).concat(
        difference(payload.contexts, state.contexts)
      )
    };
  },
  "remove-contexts": (state, payload) => {
    return {
      ...state,
      ...payload,
      contexts: difference(state.contexts, payload.contexts)
    };
  }
};
