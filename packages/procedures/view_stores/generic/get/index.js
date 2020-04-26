const deps = require("./deps");

const defaultQueryFn = (query) => query;

module.exports = ({ findFn, one = false, queryFn = defaultQueryFn }) => {
  return async (req, res) => {
    const context = req.query.context[process.env.CONTEXT];

    if (!context)
      throw deps.forbiddenError.message("Missing required permissions.");

    const queryBody = queryFn(req.query.query);
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

    //TODO
    //eslint-disable-next-line no-console
    console.log({ query });

    const results = await findFn({
      query,
      ...(req.query.sort && { sort: req.query.sort }),
    });

    const formattedResults = results.map((r) => {
      return { ...r.body, root: r.headers.root };
    });

    if (!one) return res.send(formattedResults);
    if (formattedResults.length > 0) return res.send(formattedResults[0]);
    throw deps.resourceNotFoundError.message("This view wasn't found.");
  };
};
