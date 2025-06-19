export default ({ rootStreamFn }) => async (req, res) => {
  await rootStreamFn({
    ...(req.query.parallel && { parallel: req.query.parallel }),
    fn: (data) =>
      res.write(JSON.stringify({ root: data.root, updated: data.updated })),
  });

  res.end();
};
