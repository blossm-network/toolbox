module.exports = ({ streamFn }) => {
  return async (req, res) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ params: req.params, query: req.query });
    await streamFn({
      root: req.params.root,
      from: req.query.from,
      ...(req.query.parallel && { parallel: req.query.parallel }),
      fn: (event) => {
        //TODO
        //eslint-disable-next-line no-console
        console.log("YAA: ", { event });
        res.write(JSON.stringify(event));
      },
    });

    res.end();
  };
};
