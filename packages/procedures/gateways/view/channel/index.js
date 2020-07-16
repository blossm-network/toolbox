const deps = require("./deps");

module.exports = (req, res) => {
  if (!req.query.context || !req.query.context[process.env.CONTEXT])
    throw deps.forbiddenError.message("Missing required permissions.");

  const channel = deps.channelName({
    name: req.query.name,
    ...(req.query.source &&
      req.query.source.root &&
      req.query.source.domain &&
      req.query.source.service &&
      req.query.source.network && {
        source: {
          root: req.query.source.root,
          domain: req.query.source.domain,
          service: req.query.source.service,
          network: req.query.source.network,
        },
      }),
    context: {
      root: req.query.context[process.env.CONTEXT].root,
      domain: process.env.CONTEXT,
      service: req.query.context[process.env.CONTEXT].service,
      network: req.query.context[process.env.CONTEXT].network,
    },
  });
  res.status(200).send(channel);
};
