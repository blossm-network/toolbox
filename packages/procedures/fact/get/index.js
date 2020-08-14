const deps = require("./deps");

module.exports = ({ mainFn, queryAggregatesFn, aggregateFn, contexts }) => {
  return async (req, res) => {
    //TODO
    console.log({ reqContext: req.query.context, contexts });
    if (
      contexts &&
      (!req.query.context ||
        contexts.filter((c) => req.query.context[c]).length != contexts.length)
    )
      throw deps.forbiddenError.message("This context is forbidden.");

    const { headers = {}, response } = await mainFn({
      query: req.query.query,
      ...(req.params.root && { root: req.params.root }),
      ...(req.query.context && { context: req.query.context }),
      queryAggregatesFn: queryAggregatesFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(req.query.token && { token: req.query.token }),
      }),
      aggregateFn: aggregateFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(req.query.token && { token: req.query.token }),
      }),
    });

    res.set(headers).status(200).send(response);
  };
};
