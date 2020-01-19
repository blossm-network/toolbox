module.exports = {
  create: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  enter: state => state
};
