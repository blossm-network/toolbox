const deps = require("./deps");

module.exports = ({ aggregateFn, queryFn }) => {
  return async (req, res) => {
    if (req.params.root) {
      const result = await aggregateFn(req.params.root);

      if (!result)
        throw deps.resourceNotFoundError.root({
          info: { root: req.params.root },
        });

      res.send(result);
    } else {
      const results = await queryFn({
        key: req.query.key,
        value: req.query.value,
      });
      res.send(results);
    }
  };
};
