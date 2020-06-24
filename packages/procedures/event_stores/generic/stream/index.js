module.exports = ({ streamFn }) => {
  return async (req, res) => {
    await streamFn({
      root: req.params.root,
      from: req.query.from,
      ...(req.query.parallel && { parallel: req.query.parallel }),
      fn: (event) => {
        res.write(JSON.stringify(event));
        // res.flush();
      },
    });

    res.end();
  };
};
