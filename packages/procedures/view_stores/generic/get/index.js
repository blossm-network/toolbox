const deps = require("./deps");

const defaultQueryFn = (query) => query;

module.exports = ({ findFn, one = false, queryFn = defaultQueryFn }) => {
  return async (req, res) => {
    const context = req.query.context[process.env.CONTEXT];

    if (!context)
      throw deps.forbiddenError.message("Missing required permissions.");

    const queryBody = queryFn(req.query.query || {});
    const formattedQueryBody = {};
    for (const key in queryBody) {
      formattedQueryBody[`body.${key}`] = queryBody[key];
    }

    const query = {
      ...formattedQueryBody,
      [`headers.${process.env.CONTEXT}`]: {
        root: context.root,
        service: context.service,
        network: context.network,
      },
      ...(req.params.root &&
        process.env.DOMAIN &&
        process.env.SERVICE && {
          [`headers.${process.env.DOMAIN}`]: {
            root: req.params.root,
            service: process.env.SERVICE,
            network: process.env.NETWORK,
          },
        }),
    };

    const results = await findFn({
      query,
      ...(req.query.sort && { sort: req.query.sort }),
    });

    const formattedResults = results.map((r) => {
      return { ...r.body, root: r.headers.root };
    });

    const updates = `http://updates.${
      process.env.CORE_NETWORK
    }/channel?query%5Bcontext%5D=${process.env.CONTEXT}&query%5Bnetwork%5D=${
      process.env.NETWORK
    }${
      req.params.root && process.env.DOMAIN && process.env.SERVICE
        ? `&query%5Bdomain%5D=${process.env.DOMAIN}&query%5B${process.env.DOMAIN}%5D%5Broot%5D=${req.params.root}&query%5B${process.env.DOMAIN}%5D%5Bservice%5D=${process.env.SERVICE}&query%5B${process.env.DOMAIN}%5D%5Bnetwork%5D=${process.env.NETWORK}`
        : ""
    }`;

    if (!one) return res.send({ content: formattedResults, updates });
    if (formattedResults.length > 0)
      return res.send({ content: formattedResults[0], updates });
    throw deps.resourceNotFoundError.message("This view wasn't found.");
  };
};
