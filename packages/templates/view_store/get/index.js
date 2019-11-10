const deps = require("./deps");

const defaultFn = query => {
  const querySort = query && query.sort;
  delete query.sort;
  delete query.context;
  return { query, sort: querySort };
};

module.exports = ({ store, fn = defaultFn }) => {
  return async (req, res) => {
    const { query, sort } = fn(req.query);

    if (req.params.id == undefined) {
      const results = await deps.db.find({
        store,
        query,
        ...(sort && { sort }),
        options: {
          lean: true
        }
      });

      res.send(results);
    } else {
      const result = await deps.db.findOne({
        store,
        query: {
          ...(req.params.id && { id: req.params.id })
        },
        options: {
          lean: true
        }
      });

      if (!result) throw deps.notFoundError.id();
      res.send(result);
    }
  };
};
