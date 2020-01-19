module.exports = {
  register: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  "attempt-register": (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  "add-contexts": (state, payload) => {
    return {
      ...state,
      contexts: [...(state.contexts || []), ...payload.contexts]
    };
  }
};
