/**
 * This file is required.
 *
 * Specifies the job logic.
 *
 * The function takes in the payload param from the request (req.body.payload).
 * It is not responsible for returning anything.
 *
 */

const deps = require("./deps");

module.exports = async ({ query, root, context, claims }) => {
  await deps
    .eventStore({
      domain: "some-domain",
      service: "some-service",
    })
    .set({ token: { internalFn: deps.gcpToken } })
    .aggregate("some-root");

  //eslint-disable-next-line no-console
  console.log("Do something with: ", { query, root, context, claims });
  return { response: { some: "response " } };
};
