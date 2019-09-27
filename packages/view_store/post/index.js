const deps = require("./deps");

module.exports = ({ store, fn }) => {
  return async (req, res) => {
    const id = deps.uuid();
    const now = deps.fineTimestamp();

    const update = fn ? fn(req.body) : { $set: req.body };
    update.$set = {
      ...update.$set,
      id,
      modified: now,
      created: now
    };

    const view = await store.write({
      query: { id },
      update
    });

    res.send(view);
  };
};
