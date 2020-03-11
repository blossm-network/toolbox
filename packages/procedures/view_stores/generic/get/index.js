const deps = require("./deps");

const defaultQueryFn = ({ query }) => query;

module.exports = ({ findFn, findOneFn, queryFn = defaultQueryFn }) => {
  return async (req, res) => {
    if (req.params.root) {
      const result = await findOneFn({
        root: req.params.root,
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
      const results = await findFn({
        query,
        ...(req.query.sort && { sort: req.query.sort }),
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims })
      });

      res.send(results);
    }
  };
};
