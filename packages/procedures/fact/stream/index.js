import deps from "./deps.js";

// The caller's token, forwarded in a header so it stays out of request logs.
const forwardedToken = (req) => req.headers && req.headers["blossm-token"];

export default ({
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
        ...(forwardedToken(req) && { token: forwardedToken(req) }),
      }),
      aggregateFn: aggregateFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(forwardedToken(req) && { token: forwardedToken(req) }),
      }),
      headersFn: (headers) => res.writeHead(200, headers),
      streamFn: (data) => deps.write(res, data),
      readFactFn: readFactFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(forwardedToken(req) && { token: forwardedToken(req) }),
      }),
      streamFactFn: streamFactFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(forwardedToken(req) && { token: forwardedToken(req) }),
      }),
      parallel: req.query.parallel || 100,
    });

    res.end();
  };
};
