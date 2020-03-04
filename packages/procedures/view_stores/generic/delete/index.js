const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  if (req.query.query == undefined && req.params.id == undefined)
    throw deps.badRequestError.message(
      "Missing query parameter in the url's query."
    );

  const { deletedCount } = await removeFn({
    ...req.query.query,
    ...(req.params.id && { id: req.params.id })
  });

  res.send({ deletedCount });
};
