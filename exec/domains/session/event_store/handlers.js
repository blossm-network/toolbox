module.exports = {
  start: (state, payload) => {
    //eslint-disable-next-line
    console.log("start handler: ", { state, payload });
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
    //eslint-disable-next-line
    console.log("logout handler: ", { state, payload });

    return {
      ...state,
      ...payload,
      terminated: true
    };
  },
  "switch-context": (state, payload) => {
    //eslint-disable-next-line
    console.log("switch handler: ", { state, payload });
    return {
      ...state,
      contexts: {
        current: payload.context,
        all: [...(state.contexts ? state.contexts.all : []), payload.context]
      }
    };
  }
};
