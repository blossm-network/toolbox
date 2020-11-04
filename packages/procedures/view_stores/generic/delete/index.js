const deps = require("./deps");

module.exports = ({ removeFn, groupsLookupFn, group }) => async (req, res) => {
  if (!req.query.query && !req.params.id)
    throw deps.badRequestError.message("Missing query.");

  const principalGroups =
    group &&
    (await groupsLookupFn({
      token: req.query.token,
    }));

  const formattedQueryBody = {};
  for (const key in req.query.query || {}) {
    formattedQueryBody[`body.${key}`] = req.query.query[key];
  }

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.query.id && { "headers.id": req.query.id }),
    ...(process.env.CONTEXT && {
      "headers.context": {
        root: req.query.context[process.env.CONTEXT].root,
        domain: process.env.CONTEXT,
        service: req.query.context[process.env.CONTEXT].service,
        network: req.query.context[process.env.CONTEXT].network,
      },
    }),
    ...(principalGroups && {
      "headers.groups": {
        $elemMatch: {
          $in: principalGroups,
        },
      },
    }),
  });

  res.status(200).send({ deletedCount });
};
