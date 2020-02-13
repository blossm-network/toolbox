/**
 * This file is required.
 *
 * Specifies the projection logic.
 *
 * The function takes in the event that it is subscribed to.
 *
 */

module.exports = async event => {
  const context = event.headers.context;

  return {
    name: event.payload.name,
    ...(event.payload.avatar &&
      event.payload.avatar.url && {
        avatar: {
          url: event.payload.avatar.url
        },
        identity: context.identity
      })
  };
};
