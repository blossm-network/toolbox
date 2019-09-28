const { badRequest } = require("@sustainers/errors");

const deps = require("./deps");

module.exports = ({ store }) => async (req, res) => {
  if (req.params.id == undefined) throw badRequest.missingId;

  const { deletedCount } = await deps.db.remove({
    store,
    query: { id: req.params.id }
  });
  res.send({ deletedCount });
};
