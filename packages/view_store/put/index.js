const deps = require("./deps");

const { badRequest } = require("@sustainers/errors");

module.exports = ({ store, fn }) => {
  return async (req, res) => {
    if (req.params.id == undefined) throw badRequest.missingId;

    // Can't set the id, created, or modified.
    delete req.body.id;
    delete req.body.created;
    delete req.body.modified;

    const update = fn ? fn(req.body) : { $set: req.body };
    update.$set = {
      ...update.$set,
      modified: deps.fineTimestamp()
    };

    await store.write({
      query: { id: req.params.id },
      update
    });

    res.send();
  };
};
