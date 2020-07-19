const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  if (!req.body.query) throw deps.badRequestError.message("Missing query.");

  const formattedQueryBody = {};
  for (const key in req.body.query || {}) {
    formattedQueryBody[`body.${key}`] = req.body.query[key];
  }

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.body.context && {
      "headers.context.root": req.body.context[process.env.CONTEXT].root,
      "headers.context.domain": process.env.CONTEXT,
      "headers.context.service": req.body.context[process.env.CONTEXT].service,
      "headers.context.network": req.body.context[process.env.CONTEXT].network,
    }),
  });

  res.status(200).send({ deletedCount });
};
