const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  if (!req.query.query && !req.params.id)
    throw deps.badRequestError.message("Missing query.");

  const formattedQueryBody = {};
  for (const key in req.query.query || {})
    formattedQueryBody[`body.${key}`] = req.query.query[key];

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.params.id && { "headers.id": req.params.id }),
  });

  //TODO
  console.log({ deletedCount, formattedQueryBody, id: req.params.id });
  res.status(200).send({ deletedCount });
};
