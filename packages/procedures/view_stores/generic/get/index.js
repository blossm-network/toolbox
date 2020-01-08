const deps = require("./deps");

const defaultFn = query => {
  const querySort = query && query.sort;
  delete query.sort;
  delete query.context;
  return { query, sort: querySort };
};

module.exports = ({ findFn, findOneFn, fn = defaultFn }) => {
  return async (req, res) => {
    const { query, sort } = fn(req.query);

    if (req.params.id) {
      const result = await findOneFn({
        id: req.params.id
      });

      if (!result) throw deps.resourceNotFoundError.view();
      res.send(result);
    } else {
      const results = await findFn({
        query,
        ...(sort && { sort })
      });

      res.send(results);
    }
  };
};
