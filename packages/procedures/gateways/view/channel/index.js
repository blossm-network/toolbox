import deps from "./deps.js";

export default (req, res) => {
  if (
    process.env.CONTEXT &&
    (!req.query.context || !req.query.context[process.env.CONTEXT])
  )
    throw deps.forbiddenError.message("Missing required permissions.");

  const channel = deps.channelName({
    name: req.query.name,
    ...(process.env.CONTEXT && {
      context: {
        root: req.query.context[process.env.CONTEXT].root,
        domain: process.env.CONTEXT,
        service: req.query.context[process.env.CONTEXT].service,
        network: req.query.context[process.env.CONTEXT].network,
      },
    }),
    ...(req.query.key && {
      key: req.query.key,
    }),
    ...(!process.env.CONTEXT &&
      req.query.context &&
      req.query.context.principal && {
        principal: {
          root: req.query.context.principal.root,
          service: req.query.context.principal.service,
          network: req.query.context.principal.network,
        },
      }),
  });
  res.status(200).send(channel);
};
