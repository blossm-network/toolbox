const deps = require("./deps");

module.exports = ({ store, fn }) => {
  return async (req, res) => {
    const id = (req.params && req.params.id) || deps.uuid();

    const now = deps.fineTimestamp();

    const update = fn ? fn(req.body) : { $set: req.body };
    update.$set = {
      ...update.$set,
      id,
      modified: now,
      created: now
    };

    const view = await deps.db.write({
      store,
      query: { id },
      update,
      options: {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    });

    res.send(view);
  };
};
