module.exports = ({ mainFn, viewsFn }) => {
  return async (req, res) => {
    const response = await mainFn({
      query: req.query.query,
      ...(req.query.context && { context: req.query.context }),
      viewsFn: viewsFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(req.query.token && { token: req.query.token }),
      }),
    });

    res.status(200).send(response);
  };
};
