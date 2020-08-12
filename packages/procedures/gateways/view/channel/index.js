const deps = require("./deps");

module.exports = (req, res) => {
  if (!req.query.context || !req.query.context[process.env.CONTEXT])
    throw deps.forbiddenError.message("Missing required permissions.");

  const channel = deps.channelName({
    name: req.query.name,
    context: {
      root: req.query.context[process.env.CONTEXT].root,
      domain: process.env.CONTEXT,
      service: req.query.context[process.env.CONTEXT].service,
      network: req.query.context[process.env.CONTEXT].network,
    },
  });
  res.status(200).send(channel);
};
