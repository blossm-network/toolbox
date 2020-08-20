const deps = require("./deps");

const defaultQueryFn = (query) => query;
const defaultLimit = 100;

module.exports = ({
  findFn,
  countFn,
  one = false,
  group,
  formatFn,
  emptyFn,
  queryFn = defaultQueryFn,
  groupsLookupFn,
}) => {
  return async (req, res) => {
    if (group && (!req.query.context || !req.query.context.principal))
      throw deps.forbiddenError.message("This request is missing a context.");

    const queryBody = queryFn(req.query.query || {});
    const formattedQueryBody = {};
    for (const key in queryBody)
      formattedQueryBody[`body.${key}`] = queryBody[key];

    if (
      req.query.bootstrap &&
      process.env.BOOTSTRAP_CONTEXT &&
      !req.query.context[process.env.BOOTSTRAP_CONTEXT]
    )
      throw deps.forbiddenError.message("There isn't a context to bootstrap.");

    const principalGroups =
      group &&
      (await groupsLookupFn({
        token: req.query.token,
      }));

    const query = {
      ...(!req.query.bootstrap && { ...formattedQueryBody }),
      ...(req.params.id && { "headers.id": req.params.id }),
      ...(req.query.bootstrap &&
        process.env.BOOTSTRAP_CONTEXT && {
          "headers.id": req.query.context[process.env.BOOTSTRAP_CONTEXT].root,
        }),
      ...(process.env.CONTEXT && {
        "headers.context": {
          root: req.query.context[process.env.CONTEXT].root,
          domain: process.env.CONTEXT,
          service: req.query.context[process.env.CONTEXT].service,
          network: req.query.context[process.env.CONTEXT].network,
        },
      }),
      ...(principalGroups && {
        "headers.groups": {
          $elemMatch: {
            $in: principalGroups,
          },
        },
      }),
    };

    let formattedSort;
    if (!req.query.bootstrap) {
      if (req.query.limit) req.query.limit = parseInt(req.query.limit);
      if (req.query.skip) req.query.skip = parseInt(req.query.skip);
      if (req.query.sort) {
        formattedSort = {};
        for (const key in req.query.sort) {
          formattedSort[`body.${key}`] = parseInt(req.query.sort[key]);
        }
      }
    }

    const limit =
      one || req.query.bootstrap ? 1 : req.query.limit || defaultLimit;
    const skip = one || req.query.bootstrap ? 0 : req.query.skip || 0;

    const [results, count] = await Promise.all([
      findFn({
        query,
        limit,
        skip,
        ...(formattedSort && { sort: formattedSort }),
      }),
      ...(one || req.query.bootstrap ? [] : [countFn({ query })]),
    ]);

    const updates = `https://updates.${
      process.env.CORE_NETWORK
    }/channel?query%5Bname%5D=${process.env.NAME}${
      process.env.CONTEXT ? `&query%5Bcontext%5D=${process.env.CONTEXT}` : ""
    }&query%5Bnetwork%5D=${process.env.NETWORK}${
      !process.env.CONTEXT && req.query.context && req.query.context.principal
        ? `&query%5Bprincipal%5D=${req.query.context.principal.root}`
        : ""
    }`;

    const formattedResults = results.map((r) => {
      const formattedTrace = [];
      for (const service in r.trace) {
        for (const domain in r.trace[service]) {
          for (const txId of r.trace[service][domain])
            if (!formattedTrace.includes(txId)) formattedTrace.push(txId);
        }
      }

      return {
        ...formatFn({ body: r.body, id: r.headers.id, updates }),
        headers: {
          trace: formattedTrace,
          id: r.headers.id,
          context: r.headers.context,
          ...(r.headers.groups && { groups: r.headers.groups }),
        },
      };
    });

    if (!one && !req.query.bootstrap) {
      const limit = req.query.limit || defaultLimit;
      const url = `https://v${
        process.env.CONTEXT ? `.${process.env.CONTEXT}` : ``
      }.${process.env.NETWORK}/${process.env.NAME}`;
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
        content:
          formattedResults.length == 0 && emptyFn
            ? emptyFn(queryBody)
            : formattedResults,
        updates,
        ...(next && { next }),
        count,
      });
    } else if (formattedResults.length > 0) {
      res.send({
        content: formattedResults[0],
        updates,
      });
    } else {
      throw deps.resourceNotFoundError.message("This view wasn't found.");
    }
  };
};
