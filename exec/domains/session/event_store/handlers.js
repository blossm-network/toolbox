module.exports = {
  start: (state, payload) => {
    const context = payload.context;
    delete payload.context;
    return {
      ...state,
      ...payload,
      ...(context && {
        contexts: {
          current: context,
          all: [context]
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
