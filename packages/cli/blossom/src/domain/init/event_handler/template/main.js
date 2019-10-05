/**
 * This file is required.
 *
 * Specifies the event handler logic.
 *
 * The function takes in the event that it is subscribed to.
 * as well as the context param derived from the gateway.
 *
 */

const gcpToken = require("@sustainers/gcpToken");

/**
 * Add services that should be faked
 * in tests in the deps file.
 */
const deps = require("../deps");

module.exports = ({ event }) => {
  //eslint-disable-next-line no-console
  console.log("Do something with: ", { event });

  // const root = event.headers.root;
  // const context = event.context;

  deps
    .viewStore({
      id: process.env.TARGET_ID,
      domain: process.env.TARGET_DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
    .create({
      name: event.payload.name
    })
    .with(gcpToken);
};
