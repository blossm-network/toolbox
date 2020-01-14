const deps = require("./deps");

module.exports = ({ aggregateFn, queryFn }) => {
  return async (req, res) => {
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
