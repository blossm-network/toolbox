import deps from "./deps.js";

export default ({ removeFn }) => async (req, res) => {
  if (!req.params.id && Object.keys(req.query.query || {}).length === 0)
    throw deps.badRequestError.message("Missing query.");

  const context = process.env.CONTEXT &&
    req.query.context &&
    req.query.context[process.env.CONTEXT];
  if (process.env.CONTEXT && !context)
    throw deps.forbiddenError.message("This context is forbidden.");

  const formattedQueryBody = {};
  for (const key in req.query.query || {})
    formattedQueryBody[`body.${key}`] = req.query.query[key];

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(req.params.id && { "headers.id": req.params.id }),
    ...(context && {
      "headers.context": {
        root: context.root,
        domain: process.env.CONTEXT,
        service: context.service,
        network: context.network,
      },
    }),
  });

  res.status(200).send({ deletedCount });
};
