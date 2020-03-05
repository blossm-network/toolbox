module.exports = {
  register: (state, payload) => {
    return {
      ...state,
      ...payload,
      ...(payload.avatar &&
        payload.avatar.url && {
          avatar: {
            url: payload.avatar.url
          }
        })
    };
  }
};
