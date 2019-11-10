const deps = require("./deps");

module.exports = ({ store }) => async (req, res) => {
  if (req.params.id == undefined) throw deps.badRequestError.missingId();

  const { deletedCount } = await deps.db.remove({
    store,
    query: { id: req.params.id }
  });
  res.send({ deletedCount });
};
