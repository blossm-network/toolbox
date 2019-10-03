const deps = require("./deps");
const { notFound } = require("@sustainers/errors");

module.exports = ({ store }) => {
  return async (req, res) => {
    //eslint-disable-next-line no-console
    console.log("GOT THE ROOT: ", { params: req.params, query: req.query });
    const result = await deps.db.findOne({
      store,
      query: {
        "value.headers.root": req.params.root
      },
      options: {
        lean: true
      }
    });

    //eslint-disable-next-line no-console
    console.log("THE RESULT: ", { result });

    if (!result) throw notFound.root;

    res.send(result.value);
  };
};
