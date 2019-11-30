const deps = require("./deps");

module.exports = ({ store }) => {
  return async (req, res) => {
    const result = await deps.db.findOne({
      store,
      query: {
        "value.headers.root": req.params.root
      },
      options: {
        lean: true
      }
    });

    if (!result) throw deps.resourceNotFoundError.root();

    res.send(result.value);
  };
};
