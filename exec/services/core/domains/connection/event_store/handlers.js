module.exports = {
  open: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
