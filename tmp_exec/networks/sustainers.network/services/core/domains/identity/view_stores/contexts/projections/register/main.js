module.exports = async event => {
  return {
    context: event.payload.context,
    name: event.payload.name
    // ...(event.payload.avatar &&
    //   event.payload.avatar.url && {
    //     avatar: {
    //       url: event.payload.avatar.url
    //     }
    //   })
  };
};
