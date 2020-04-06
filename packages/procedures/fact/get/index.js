module.exports = ({ mainFn }) => {
  return async (req, res) => {
    const response = await mainFn({
      params: req.params,
      query: req.query.query,
      ...(req.query.context && { context: req.query.context }),
      ...(req.query.claims && { claims: req.query.claims })
    });

    res.status(200).send(response);
  };
};
