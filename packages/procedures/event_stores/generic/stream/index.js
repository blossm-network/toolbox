module.exports = ({ streamFn }) => async (req, res) => {
  await streamFn({
    root: req.params.root,
    from: req.query.from,
    ...(req.query.parallel && { parallel: req.query.parallel }),
    ...(req.query.actions && { actions: req.query.actions }),
    fn: (event) => res.write(JSON.stringify(event)),
  });

  res.end();
};
