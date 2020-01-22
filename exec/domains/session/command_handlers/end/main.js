const deps = require("./deps");

const { badRequest } = require("@blossm/errors");

module.exports = async ({ root, aggregateFn }) => {
  const { aggregate } = await aggregateFn(root);

  if (aggregate.ended) throw badRequest.sessionAlreadyEnded;

  return { events: [{ ended: deps.stringDate() }] };
};
