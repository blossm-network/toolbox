const deps = require("./deps");

const defaultQueryFn = ({ query }) => query;

module.exports = ({ findFn, findOneFn, queryFn = defaultQueryFn }) => {
  return async (req, res) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ query: req.query, params: req.params });
    if (req.params.id) {
      const result = await findOneFn({
        id: req.params.id,
        ...(req.query.sort && { sort: req.query.sort }),
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims })
      });

      if (!result) throw deps.resourceNotFoundError.view();
      res.send(result);
    } else {
      const query = queryFn({
        query: req.query.query,
        ...(req.query.context && { context: req.query.context })
      });
      //TODO
      //eslint-disable-next-line no-console
      console.log({ formattedQuery: query });
      const results = await findFn({
        query,
        ...(req.query.sort && { sort: req.query.sort }),
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims })
      });
      //TODO
      //eslint-disable-next-line no-console
      console.log({ results });

      res.send(results);
    }
  };
};
