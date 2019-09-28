const deps = require("./deps");

module.exports = ({ store, fn }) => {
  return async (req, res) => {
    const uuid = (req.params && req.params.id) || deps.uuid();

    const now = deps.fineTimestamp();

    const update = fn ? fn(req.body) : { $set: req.body };
    update.$set = {
      ...update.$set,
      uuid,
      modified: now,
      created: now
    };

    const view = await deps.db.write({
      store,
      query: { uuid },
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

    res.send(view);
  };
};
