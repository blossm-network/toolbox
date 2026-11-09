import deps from "./deps.js";

export const remove = ({ removeFn }) => async ({ id, query, context: requestContext }) => {
  if (!id && Object.keys(query || {}).length === 0)
    throw deps.badRequestError.message("Missing query.");

  const context = process.env.CONTEXT &&
    requestContext &&
    requestContext[process.env.CONTEXT];
  if (process.env.CONTEXT && !context)
    throw deps.forbiddenError.message("This context is forbidden.");

  const formattedQueryBody = {};
  for (const key in query || {})
    formattedQueryBody[`body.${key}`] = query[key];

  const { deletedCount } = await removeFn({
    ...formattedQueryBody,
    ...(id && { "headers.id": id }),
    ...(context && {
      "headers.context": {
        root: context.root,
        domain: process.env.CONTEXT,
        service: context.service,
        network: context.network,
      },
    }),
  });

  return { deletedCount };
};

export default (options) => async (req, res) => {
  const result = await remove(options)({
    id: req.params.id,
    query: req.query.query,
    context: req.query.context,
  });
  res.status(200).send(result);
};
