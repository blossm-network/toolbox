module.exports = ({ mainFn }) => {
  return async (req, res) => {
    const { headers = {}, response } = await mainFn({
      query: req.query.query,
      ...(req.params.root && { root: req.params.root }),
      ...(req.query.context && { context: req.query.context }),
    });

    res.set(headers).status(200).send(response);
  };
};
