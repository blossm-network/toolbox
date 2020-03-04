const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  if (req.params.root == undefined) throw deps.badRequestError.missingId();

  const { deletedCount } = await removeFn({
    root: req.params.root
  });

  res.send({ deletedCount });
};
