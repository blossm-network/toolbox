const deps = require("./deps");
const logger = require("@sustainers/logger");

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

    const r = await deps.db.mapReduce({
      store,
      query: { id },
      map: deps.normalize,
      reduce: deps.reduce,
      out: { reduce: aggregateStoreName }
    });

    logger.info("r: ", { r });

    res.status(204).send();
  };
};
