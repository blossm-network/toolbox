module.exports = ({ store, fn }) => {
  return async (req, res) => {
    const query = fn ? fn(req.query) : req.query;
    const results = await store.find({
      ...query,
      ...(req.params.id && { id: req.params.id })
    });
    res.send(results);
  };
};
