module.exports = {
  start: (state, payload) => {
    return {
      ...state,
      ...payload,
      ...(payload.context && {
        contexts: {
          current: payload.context,
          all: [payload.context]
        }
      })
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
  "switch-context": (state, payload) => {
    return {
      ...state,
      contexts: {
        current: payload.context,
        all: [...(state.contexts ? state.contexts.all : []), payload.context]
      }
    };
  }
};
