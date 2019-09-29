const deps = require("./deps");

module.exports = ({ store, aggregateStoreName }) => {
  return async (req, res) => {
    const id = deps.uuid();

    const now = deps.dateString();

    const update = {
      $set: {
        ...req.body,
        id,
        created: now
      }
    };

    await deps.db.write({
      store,
      query: { id },
      update,
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });

    await deps.db.mapReduce({
      store,
      query: { id },
      mapFn: deps.normalize,
      reduceFn: deps.reduce,
      out: { reduce: aggregateStoreName }
    });

    res.status(204).send();
  };
};
