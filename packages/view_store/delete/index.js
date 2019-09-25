const { badRequest } = require("@sustainers/errors");

module.exports = ({ store }) => async (req, res) => {
  if (req.params.id == undefined) throw badRequest.missingId;

  await store.remove({ query: { id: req.params.id } });
  res.send();
};
