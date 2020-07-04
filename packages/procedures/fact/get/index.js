module.exports = ({ mainFn, queryAggregatesFn }) => {
  return async (req, res) => {
    const { headers = {}, response } = await mainFn({
      query: req.query.query,
      ...(req.params.root && { root: req.params.root }),
      ...(req.query.context && { context: req.query.context }),
      queryAggregatesFn: queryAggregatesFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(req.query.token && { token: req.query.token }),
      }),
    });

    res.set(headers).status(200).send(response);
  };
};
