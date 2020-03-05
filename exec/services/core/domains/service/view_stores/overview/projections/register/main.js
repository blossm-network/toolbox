module.exports = async event => {
  const context = event.headers.context;

  return {
    name: event.payload.name,
    identity: context.identity
    // ...(event.payload.avatar &&
    //   event.payload.avatar.url && {
    //     avatar: {
    //       url: event.payload.avatar.url
    //     }
    //   })
  };
};
