/**
 * This file is required.
 *
 * Specifies the command handler logic.
 *
 * The function takes in the payload param from the request (req.body.payload),
 * the root that is being commanded (optional),
 * the context param derived from the gateway,
 * and an async function which takes a root argument to derive the aggregate.
 * It is responsible for returning an array of events to publish
 * and also the response that should be sent back to the issuer of the request.
 *
 */

//const deps = require("./deps");

module.exports = async ({ payload, root, context, aggregateFn }) => {
  //eslint-disable-next-line no-console
  console.log("Do something with: ", {
    payload,
    root,
    context,
    aggregateFn
  });

  return {
    events: [{ action: "some-action", payload, root, correctNumber: 0 }]
  };
};
