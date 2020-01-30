module.exports = {
  "add-permissions": (state, payload) => {
    return {
      ...state,
      ...payload,
      permissions: state.permissions.concat(payload.permissions)
    };
  },
  "remove-permissions": (state, payload) => {
    return {
      ...state,
      ...payload,
      permissions: state.permissions.filter(
        p => !payload.permissions.includes(p)
      )
    };
  }
};
