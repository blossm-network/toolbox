const deps = require("./deps");

module.exports = ({
  mainFn,
  queryAggregatesFn,
  aggregateFn,
  readFactFn,
  streamFactFn,
  contexts,
}) => {
  return async (req, res) => {
    if (
      contexts &&
      (!req.query.context ||
        contexts.filter((c) => req.query.context[c]).length != contexts.length)
    )
      throw deps.forbiddenError.message("This context is forbidden.");

    await mainFn({
      query: req.query.query,
      ...(req.params.root && { root: req.params.root }),
      ...(req.query.context && { context: req.query.context }),
      ...(req.query.claims && { claims: req.query.claims }),
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
      headersFn: (headers) => {
        res.writeHead(200, headers);
        res.flushHeaders();
      },
      streamFn: (data) =>
        res.write(
          typeof data === "object" && !Buffer.isBuffer(data) && data !== null
            ? JSON.stringify(data)
            : data
        ),
      readFactFn: readFactFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(req.query.token && { token: req.query.token }),
      }),
      streamFactFn: streamFactFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(req.query.token && { token: req.query.token }),
      }),
      parallel: req.query.parallel || 100,
    });

    res.end();
  };
};
