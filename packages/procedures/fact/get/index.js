module.exports = ({ mainFn }) => {
  return async (req, res) => {
    const response = await mainFn({
      query: req.query.query,
      ...(req.params.root && { root: req.params.root }),
      ...(req.query.context && { context: req.query.context }),
      ...(req.query.claims && { claims: req.query.claims }),
    });

    res.status(200).send(response);
  };
};
