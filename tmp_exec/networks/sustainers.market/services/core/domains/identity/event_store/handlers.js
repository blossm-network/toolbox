module.exports = {
  register: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
