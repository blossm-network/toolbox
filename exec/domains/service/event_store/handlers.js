module.exports = {
  create: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
