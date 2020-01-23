module.exports = {
  "add-identities": (state, payload) => {
    return {
      ...state,
      identities: [...(state.identities || []), ...payload.identities]
    };
  },
  "add-contexts": (state, payload) => {
    return {
      ...state,
      contexts: [...(state.contexts || []), ...payload.contexts]
    };
  }
};
