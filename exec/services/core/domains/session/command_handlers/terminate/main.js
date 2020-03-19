const deps = require("./deps");

module.exports = async ({ root, aggregateFn }) => {
  // Get the aggregate for this session.
  const { aggregate } = await aggregateFn(root);

  // Check to see if this session has already been terminated.
  if (aggregate.terminated)
    throw deps.badRequestError.sessionAlreadyTerminated();

  return {
    events: [
      { root, action: "terminate", payload: { terminated: deps.stringDate() } }
    ]
  };
};
