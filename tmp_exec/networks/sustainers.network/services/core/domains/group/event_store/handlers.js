module.exports = {
  "add-identities": (state, payload) => {
    return {
      ...state,
      identities: [...(state.identities || []), ...payload.identities]
    };
  }
};
