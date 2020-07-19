const deps = require("./deps");

module.exports = ({ removeFn }) => async (req, res) => {
  //TODO
  console.log("asdffffff: ", { body: req.body, query: req.query });
  if (!req.body.query) throw deps.badRequestError.message("Missing query.");

  const formattedQueryBody = {};
  for (const key in req.body.query || {}) {
    formattedQueryBody[`body.${key}`] = req.body.query[key];
  }

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.body.context && {
      "headers.context.root": req.body.context.root,
      "headers.context.domain": req.body.context.domain,
      "headers.context.service": req.body.context.service,
      "headers.context.network": req.body.context.network,
    }),
  });

  res.status(200).send({ deletedCount });
};
