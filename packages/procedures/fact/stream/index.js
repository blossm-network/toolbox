module.exports = ({ mainFn }) => {
  return async (req, res) => {
    await mainFn({
      query: req.query.query,
      ...(req.params.root && { root: req.params.root }),
      ...(req.query.context && { context: req.query.context }),
      streamFn: (data) => {
        //TODO
        //eslint-disable-next-line no-console
        console.log(" streaming data", { data });
        return res.write(JSON.stringify(data));
      },
      parallel: req.query.parallel || 100,
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log("ending stream");
    res.end();
  };
};
