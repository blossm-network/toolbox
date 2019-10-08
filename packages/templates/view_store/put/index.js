const deps = require("./deps");

const { badRequest } = require("@sustainers/errors");

const defaultFn = body => {
  return { update: { $set: body } };
};

module.exports = ({ store, fn = defaultFn }) => {
  return async (req, res) => {
    if (req.params.id == undefined) throw badRequest.missingId;

    // Can't set the id, created, or modified.
    delete req.body.id;
    delete req.body.created;
    delete req.body.modified;

    const { update } = fn(req.body);

    update.$set = {
      ...update.$set,
      modified: deps.dateString()
    };

    await deps.db.write({
      store,
      query: { id: req.params.id },
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
