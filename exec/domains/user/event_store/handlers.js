module.exports = {
  "save-phone-number": (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
