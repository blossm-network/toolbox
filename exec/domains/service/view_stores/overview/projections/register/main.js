module.exports = async event => {
  const context = event.headers.context;

  // TODO remove
  //eslint-disable-next-line no-console
  console.log({ context });
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
