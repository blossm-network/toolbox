const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  if (req.query.query == undefined && req.params.root == undefined)
    throw deps.badRequestError.message(
      "Missing query parameter in the url's query."
    );

  const formattedQueryBody = {};
  for (const key in req.query.query || {}) {
    formattedQueryBody[`body.${key}`] = req.query.query[key];
  }

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.params.root && { "headers.root": req.params.root }),
  });

  res.status(200).send({ deletedCount });
};
