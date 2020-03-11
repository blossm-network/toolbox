module.exports = {
  start: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  upgrade: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  logout: (state, payload) => {
    return {
      ...state,
      ...payload,
      terminated: true
    };
  },
  "change-scene": (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
