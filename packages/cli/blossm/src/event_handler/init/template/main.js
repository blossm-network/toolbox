/**
 * This file is required.
 *
 * Specifies the event handler logic.
 *
 * The function takes in the event that it is subscribed to.
 * as well as the context param derived from the gateway.
 *
 */

/**
 * Add services that should be faked
 * in tests in the deps file.
 */

module.exports = async (event) => {
  const root = event.headers.root;
  const context = event.headers.context;

  //eslint-disable-next-line no-console
  console.log("Do something with: ", { root, context });
};
