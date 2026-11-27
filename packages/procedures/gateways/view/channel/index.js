import deps from "./deps.js";

export default (req, res) => {
  if (
    process.env.CONTEXT &&
    (!req.query.context || !req.query.context[process.env.CONTEXT])
  )
    throw deps.forbiddenError.message("Missing required permissions.");

  const channel = name(req);
  res.status(200).send(channel);
};

// The name and key come from the caller. One that can't be part of a channel
// name is the caller's mistake, not a failure here.
const name = (req) => {
  try {
    return build(req);
  } catch (error) {
    if (error instanceof TypeError)
      throw deps.badRequestError.message("This channel isn't valid.");
    throw error;
  }
};

const build = (req) =>
  deps.channelName({
    name: req.query.name,
    // This gateway serves the view, so its network owns the channel.
    network: process.env.NETWORK,
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
