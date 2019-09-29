const deps = require("./deps");
const { notFound } = require("@sustainers/errors");

module.exports = ({ store, fn }) => {
  return async (req, res) => {
    const query = fn ? fn(req.query) : req.query;

    if (req.params.id == undefined) {
      const results = await deps.db.find({
        store,
        query: {
          ...query,
          ...(req.params.id && { id: req.params.id })
        },
        options: {
          lean: true
        }
      });
      res.send(results);
    } else {
      const result = await deps.db.findOne({
        store,
        query: {
          ...(req.params.id && { id: req.params.id })
        },
        options: {
          lean: true
        }
      });

      if (!result) throw notFound.root;
      res.send(result);
    }
  };
};
