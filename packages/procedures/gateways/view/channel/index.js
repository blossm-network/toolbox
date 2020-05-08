const deps = require("./deps");

module.exports = (req, res) => {
  if (!req.query.context[process.env.CONTEXT])
    throw deps.forbiddenError.message("Missing required permissions.");

  const channel = deps.channelName({
    name: req.query.name,
    ...(process.env.DOMAIN && {
      domain: process.env.DOMAIN,
      domainRoot: req.query[process.env.DOMAIN].root,
      domainService: req.query[process.env.DOMAIN].service,
      domainNetwork: req.query[process.env.DOMAIN].network,
    }),
    context: process.env.CONTEXT,
    contextRoot: req.query.context[process.env.CONTEXT].root,
    contextService: req.query.context[process.env.CONTEXT].service,
    contextNetwork: req.query.context[process.env.CONTEXT].network,
  });
  res.status(200).send(channel);
};
