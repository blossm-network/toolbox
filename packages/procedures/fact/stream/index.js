module.exports = ({ mainFn }) => {
  return async (req, res) => {
    await mainFn({
      query: req.query.query,
      ...(req.params.root && { root: req.params.root }),
      ...(req.query.context && { context: req.query.context }),
      streamFn: (data) => res.write(data), //JSON.stringify(data)),
      parallel: req.query.parallel || 100,
    });

    res.end();
  };
};
