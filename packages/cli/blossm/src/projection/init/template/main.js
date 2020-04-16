/**
 * This file is required.
 *
 * Specifies the projection logic.
 *
 * The function takes in the event that it is subscribed to.
 *
 */

module.exports = async (event) => {
  // const root = event.headers.root;
  // const context = event.headers.context;

  return {
    body: {
      name: event.payload.name,
    },
    root: "some-root",
    domain: "some-root",
  };
};
