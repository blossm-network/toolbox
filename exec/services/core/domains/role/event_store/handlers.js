const difference = require("@blossm/array-difference");

module.exports = {
  create: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  "add-permissions": (state, payload) => {
    return {
      ...state,
      permissions: (state.permissions || []).concat(
        difference(payload.permissions, state.permissions)
      )
    };
  },
  "remove-permissions": (state, payload) => {
    return {
      ...state,
      permissions: difference(state.permissions, payload.permissions)
    };
  }
};
