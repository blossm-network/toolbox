module.exports = {
  start: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  extend: (state, payload) => {
    return {
      ...state,
      extended: [...(state.extended || []), ...payload.extended]
    };
  },
  upgrade: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  end: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
