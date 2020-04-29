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

module.exports = async ({ query, params, context }) => {
  await deps
    .viewStore({
      name: "some-name",
      domain: "some-domain",
      service: "some-service",
      context: "some-context",
    })
    .set({ tokenFns: { internal: deps.gcpToken } })
    .read({ a: "some-a" });

  //eslint-disable-next-line no-console
  console.log("Do something with: ", { query, params, context });
  return { some: "response" };
};
