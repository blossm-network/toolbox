const deps = require("./deps");

const defaultQueryFn = (query) => query;
const defaultLimit = 100;

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

    if (req.query.limit) req.query.limit = parseInt(req.query.limit);
    if (req.query.skip) req.query.skip = parseInt(req.query.skip);
    if (req.query.sort) {
      for (const sort in req.query.sort) {
        req.query.sort[sort] = parseInt(req.query.sort[sort]);
      }
    }

    const limit = one ? 1 : req.query.limit || defaultLimit;
    const skip = one ? 0 : req.query.skip || 0;

    const results = await findFn({
      query,
      limit,
      skip,
      ...(req.query.sort && { sort: req.query.sort }),
    });

    const formattedResults = results.map((r) => {
      return {
        body: r.body,
        headers: {
          root: r.headers.root,
          ...(r.headers.trace && { trace: r.headers.trace }),
        },
      };
    });

    //TODO https may not work.
    const updates = `https://updates.${
      process.env.CORE_NETWORK
    }/channel?query%5Bname%5D=${process.env.NAME}&query%5Bcontext%5D=${
      process.env.CONTEXT
    }&query%5Bnetwork%5D=${process.env.NETWORK}${
      req.params.root && process.env.DOMAIN && process.env.SERVICE
        ? `&query%5Bdomain%5D=${process.env.DOMAIN}&query%5B${process.env.DOMAIN}%5D%5Broot%5D=${req.params.root}&query%5B${process.env.DOMAIN}%5D%5Bservice%5D=${process.env.SERVICE}&query%5B${process.env.DOMAIN}%5D%5Bnetwork%5D=${process.env.NETWORK}`
        : ""
    }`;

    if (!one) {
      const limit = req.query.limit || defaultLimit;
      const url = `https://v${
        process.env.DOMAIN && process.env.SERVICE
          ? `.${process.env.DOMAIN}.${process.env.SERVICE}`
          : ""
      }.${process.env.CONTEXT}.${process.env.NETWORK}/${process.env.NAME}`;
      const next = deps.urlEncodeQueryData(url, {
        ...req.query,
        skip: skip + limit,
        limit,
      });
      res.send({ content: formattedResults, updates, next });
    } else if (formattedResults.length > 0) {
      res.send({ content: formattedResults[0], updates });
    } else {
      throw deps.resourceNotFoundError.message("This view wasn't found.");
    }
  };
};
