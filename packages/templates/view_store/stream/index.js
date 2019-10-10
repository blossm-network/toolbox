const deps = require("./deps");

const defaultFn = query => {
  const querySort = query.sort;
  const queryParallel = query.parallel || 1;
  delete query.sort;
  delete query.context;
  delete query.parallel;
  return { query, sort: querySort, parallel: queryParallel };
};

module.exports = ({ store, fn = defaultFn }) => {
  return async (req, res) => {
    const { query, sort, parallel } = fn(req.query);

    const cursor = deps.db.find({
      store,
      query,
      ...(sort && { sort }),
      options: {
        lean: true
      }
    });

    cursor.eachAsync(view => res.write(view), { parallel });
    res.end();
  };
};
