const deps = require("./deps");

module.exports = ({ store, fn }) => {
  return async (req, res) => {
    const query = fn ? fn(req.query) : req.query;
    const results =
      req.params.id == undefined
        ? await deps.db.find({
          store,
          query: {
            ...query,
            ...(req.params.id && { id: req.params.id })
          },
          options: {
            lean: true
          }
        })
        : await deps.db.findOne({
          store,
          query: {
            ...(req.params.id && { id: req.params.id })
          },
          options: {
            lean: true
          }
        });
    res.send(results);
  };
};
