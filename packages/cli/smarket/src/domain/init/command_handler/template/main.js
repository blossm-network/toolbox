/**
 * This file is required.
 *
 * Specifies the command handler logic.
 *
 * The function takes in the payload param from the request (req.body.payload),
 * as well as the context param derived from the gateway.
 * It is responsible for returning the payload of the event
 * that will be saved to document that this function happened,
 * and also the response that should be sent back to the issuer of the request.
 *
 */

module.exports = ({ payload, context }) => {
  //eslint-disable-next-line no-console
  console.log("Do something with: ", { payload, context });
};
