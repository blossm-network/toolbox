const deps = require("./deps");

const defaultQueryFn = ({ query }) => query;

module.exports = ({ findFn, findOneFn, queryFn = defaultQueryFn }) => {
  return async (req, res) => {
    //TODO remove
    //eslint-disable-next-line no-console
    console.log({
      query: req.query,
      params: req.params,
      body: req.body
    });
    if (req.params.id) {
      const result = await findOneFn({
        id: req.params.id,
        ...(req.query.sort && { sort: req.query.sort }),
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.session && { session: req.query.session })
      });

      if (!result) throw deps.resourceNotFoundError.view();
      res.send(result);
    } else {
      const query = queryFn({
        query: req.query.query,
        ...(req.query.context && { context: req.query.context })
      });
      const results = await findFn({
        query,
        ...(req.query.sort && { sort: req.query.sort }),
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.session && { session: req.query.session })
      });

      res.send(results);
    }
  };
};
