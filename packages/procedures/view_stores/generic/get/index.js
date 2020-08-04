const deps = require("./deps");

const defaultQueryFn = (query) => query;
const defaultLimit = 100;

module.exports = ({
  findFn,
  countFn,
  one = false,
  formatFn,
  queryFn = defaultQueryFn,
}) => {
  return async (req, res) => {
    if (!req.query.context)
      throw deps.forbiddenError.message("Missing required permissions.");

    const queryBody = queryFn(req.query.query || {});
    const formattedQueryBody = {};
    for (const key in queryBody) {
      formattedQueryBody[`body.${key}`] = queryBody[key];
    }

    const query = {
      ...formattedQueryBody,
      ...(req.params.id && { "headers.id": req.params.id }),
      "headers.context": {
        root: req.query.context[process.env.CONTEXT].root,
        domain: process.env.CONTEXT,
        service: req.query.context[process.env.CONTEXT].service,
        network: req.query.context[process.env.CONTEXT].network,
      },
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

    let formattedSort;
    if (req.query.sort) {
      formattedSort = {};
      for (const key in req.query.sort)
        formattedSort[`body.${key}`] = req.query.sort[key];
    }

    const [results, count] = await Promise.all([
      findFn({
        query,
        limit,
        skip,
        ...(formattedSort && { sort: formattedSort }),
      }),
      ...(one ? [] : [countFn({ query })]),
    ]);

    //TODO this function is duplicated in /post. Refactor.
    const formattedResults = results.map((r) => {
      const formattedTrace = [];
      for (const service in r.trace) {
        for (const domain in r.trace[service]) {
          for (const txId of r.trace[service][domain])
            if (!formattedTrace.includes(txId)) formattedTrace.push(txId);
        }
      }
      return {
        ...formatFn({ body: r.body, id: r.headers.id }),
        headers: {
          trace: formattedTrace,
          id: r.headers.id,
          context: r.headers.context,
        },
      };
    });

    const updates = `https://updates.${process.env.CORE_NETWORK}/channel?query%5Bname%5D=${process.env.NAME}&query%5Bcontext%5D=${process.env.CONTEXT}&query%5Bnetwork%5D=${process.env.NETWORK}`;

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
