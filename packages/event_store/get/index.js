const deps = require("./deps");
const { notFound } = require("@sustainers/errors");

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

    if (!result) throw notFound.root;

    res.send(result.value);
  };
};
