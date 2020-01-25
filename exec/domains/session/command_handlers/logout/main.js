const deps = require("./deps");

const { badRequest } = require("@blossm/errors");

module.exports = async ({ root, aggregateFn }) => {
  const { aggregate } = await aggregateFn(root);

  if (aggregate.terminated) throw badRequest.sessionTerminated();

  return {
    events: [{ root, payload: { loggedout: deps.stringDate() } }]
  };
};
