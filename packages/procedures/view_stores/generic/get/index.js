const deps = require("./deps");

const defaultFn = query => {
  return { query };
};

module.exports = ({ findFn, findOneFn, fn = defaultFn }) => {
  return async (req, res) => {
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
      const { query } = fn(req.query.query);
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
