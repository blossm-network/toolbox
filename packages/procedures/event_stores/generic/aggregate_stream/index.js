module.exports = ({ aggregateStreamFn }) => async (req, res) => {
  await aggregateStreamFn({
    ...(req.query.timestamp && { timestamp: req.query.timestamp }),
    ...(req.query.parallel && { parallel: req.query.parallel }),
    fn: (aggregate) => res.write(JSON.stringify(aggregate)),
  });

  res.end();
};
