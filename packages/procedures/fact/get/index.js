module.exports = ({ mainFn }) => {
  return async (req, res) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ query: req.query, params: req.params });
    const response = await mainFn({
      params: req.params,
      query: req.query.query,
      ...(req.query.root && { root: req.query.root }),
      ...(req.query.context && { context: req.query.context }),
      ...(req.query.claims && { claims: req.query.claims })
    });

    res.status(200).send(response);
  };
};
