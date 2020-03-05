module.exports = {
  issue: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  answer: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
