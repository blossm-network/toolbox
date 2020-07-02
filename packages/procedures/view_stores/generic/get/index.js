const deps = require("./deps");

const defaultQueryFn = (query) => query;
const defaultLimit = 100;

module.exports = ({
  findFn,
  countFn,
  one = false,
  queryFn = defaultQueryFn,
}) => {
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
      "headers.context": {
        root: context.root,
        domain: process.env.CONTEXT,
        service: context.service,
        network: context.network,
      },
      ...(req.params.sourceRoot &&
        req.params.sourceDomain &&
        req.params.sourceService &&
        req.params.sourceNetwork && {
          "headers.sources.root": req.params.sourceRoot,
          "headers.sources.domain": req.params.sourceDomain,
          "headers.sources.service": req.params.sourceService,
          "headers.sources.network": req.params.sourceNetwork,
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

    const [results, count] = await Promise.all([
      findFn({
        query,
        limit,
        skip,
        ...(req.query.sort && { sort: req.query.sort }),
      }),
      ...(one ? [] : [countFn({ query })]),
    ]);

    const formattedResults = results.map((r) => {
      return {
        body: r.body,
        headers: {
          root: r.headers.root,
          ...(r.headers.trace && { trace: r.headers.trace }),
        },
      };
    });

    const updates = `https://updates.${
      process.env.CORE_NETWORK
    }/channel?query%5Bname%5D=${process.env.NAME}&query%5Bcontext%5D=${
      process.env.CONTEXT
    }&query%5Bnetwork%5D=${process.env.NETWORK}${
      req.params.sourceRoot &&
      req.params.sourceDomain &&
      req.params.sourceService &&
      req.params.sourceNetwork
        ? `query%5Bsource%5D%5Broot%5D=${req.params.sourceRoot}&query%5Bsource%5D%5Bdomain%5D=${req.params.sourceDomain}&query%5Bsource%5D%5Bservice%5D=${req.params.sourceService}&query%5B$source%5D%5Bnetwork%5D=${req.params.sourceNetwork}`
        : ""
    }`;

    if (!one) {
      const limit = req.query.limit || defaultLimit;
      const url = `https://v${
        process.env.DOMAIN && process.env.SERVICE
          ? `.${process.env.DOMAIN}.${process.env.SERVICE}`
          : ""
      }.${process.env.CONTEXT}.${process.env.NETWORK}/${process.env.NAME}`;
      const next =
        formattedResults.length == limit && skip + limit < count
          ? deps.urlEncodeQueryData(url, {
              ...(req.query.query && {
                query: req.query.query,
              }),
              ...(req.query.sort && {
                sort: req.query.sort,
              }),
              skip: skip + limit,
              limit,
            })
          : null;
      res.send({
        content: formattedResults,
        updates,
        ...(next && { next }),
        count,
      });
    } else if (formattedResults.length > 0) {
      res.send({ content: formattedResults[0], updates });
    } else {
      throw deps.resourceNotFoundError.message("This view wasn't found.");
    }
  };
};
