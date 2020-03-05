module.exports = async payload => {
  return {
    name: payload.name,
    ...(payload.avatar && {
      avatar: {
        ...(payload.avatar.url && { url: payload.avatar.url })
      }
    })
  };
};
