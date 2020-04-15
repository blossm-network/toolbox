const deps = require("./deps");

const defaultQueryFn = query => query;

module.exports = ({ findFn, one = false, queryFn = defaultQueryFn }) => {
  return async (req, res) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ query: req.query, params: req.params });
    //TODO
    //eslint-disable-next-line no-console
    console.log({
      context: process.env.CONTEXT,
      domain: process.env.DOMAIN,
      service: process.env.SERVICE
    });

    const queryBody = queryFn(req.query.query);
    const formattedQueryBody = {};
    for (const key in queryBody) {
      formattedQueryBody[`body.${key}`] = queryBody[key];
    }

    const context = req.query.context[process.env.CONTEXT];
    const query = {
      ...formattedQueryBody,
      [`headers.${process.env.CONTEXT}`]: {
        root: context.root,
        service: context.service,
        network: context.network
      },
      ...(req.params.root &&
        process.env.DOMAIN &&
        process.env.SERVICE && {
          [`headers.${process.env.DOMAIN}`]: {
            root: req.params.root,
            service: process.env.SERVICE,
            network: process.env.NETWORK
          }
        })
    };
    //TODO
    //eslint-disable-next-line no-console
    console.log({ formattedQuery: query });
    const results = await findFn({
      query,
      ...(req.query.sort && { sort: req.query.sort })
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ results });

    const formattedResults = results.map(r => {
      return { ...r.body, root: r.headers.root };
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ formattedResults });
    if (!one) return res.send(formattedResults);
    if (formattedResults.length > 0) return res.send(formattedResults[0]);
    throw deps.resourceNotFoundError.view();
  };
};
