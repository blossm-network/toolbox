module.exports = {
  start: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
