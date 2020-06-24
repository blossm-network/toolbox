module.exports = ({ rootStreamFn }) => {
  return async (req, res) => {
    await rootStreamFn({
      ...(req.query.parallel && { parallel: req.query.parallel }),
      fn: (data) => res.write(JSON.stringify({ root: data.root })),
    });

    res.end();
  };
};
