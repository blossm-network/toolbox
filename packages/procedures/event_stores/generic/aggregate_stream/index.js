module.exports = ({ aggregateStreamFn }) => async (req, res) => {
  await aggregateStreamFn({
    timestamp: req.query.timestamp,
    fn: (aggregate) => res.write(JSON.stringify(aggregate)),
  });

  res.end();
};
