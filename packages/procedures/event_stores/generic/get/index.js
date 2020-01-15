const deps = require("./deps");

module.exports = ({ aggregateFn, queryFn }) => {
  return async (req, res) => {
    //eslint-disable-next-line
    console.log("req: ", { params: req.params, query: req.query });
    if (req.params.root) {
      const result = await aggregateFn(req.params.root);

      if (!result)
        throw deps.resourceNotFoundError.root({
          info: { root: req.params.root }
        });

      res.send(result);
    } else {
      const results = await queryFn(req.query);
      res.send(results);
    }
  };
};
