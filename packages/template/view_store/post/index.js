const deps = require("./deps");

module.exports = ({ store, fn }) => {
  return async (req, res) => {
    const id = deps.uuid();

    const now = deps.dateString();

    const { update } = fn ? fn(req.body) : { update: { $set: req.body } };

    update.$set = {
      ...update.$set,
      id,
      modified: now,
      created: now
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

    res.status(204).send();
  };
};
