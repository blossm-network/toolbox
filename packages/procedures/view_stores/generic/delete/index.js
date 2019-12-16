const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  if (req.params.id == undefined) throw deps.badRequestError.missingId();

  const { deletedCount } = await removeFn({
    id: req.params.id
  });

  res.send({ deletedCount });
};
