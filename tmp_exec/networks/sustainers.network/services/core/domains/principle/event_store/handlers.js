const difference = require("@blossm/array-difference");
module.exports = {
  "add-permissions": (state, payload) => {
    return {
      ...state,
      ...payload,
      permissions: (state.permissions || []).concat(payload.permissions)
    };
  },
  "remove-permissions": (state, payload) => {
    return {
      ...state,
      ...payload,
      permissions: difference(state.permissions, payload.permissions)
    };
  }
};
