const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  if (!req.query.query && !req.query.id)
    throw deps.badRequestError.message("Missing query.");

  const formattedQueryBody = {};
  for (const key in req.query.query || {}) {
    formattedQueryBody[`body.${key}`] = req.query.query[key];
  }

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.query.id && { "headers.id": req.query.id }),
    ...(req.query.context && {
      "headers.context.root": req.query.context[process.env.CONTEXT].root,
      "headers.context.domain": process.env.CONTEXT,
      "headers.context.service": req.query.context[process.env.CONTEXT].service,
      "headers.context.network": req.query.context[process.env.CONTEXT].network,
    }),
  });

  res.status(200).send({ deletedCount });
};
