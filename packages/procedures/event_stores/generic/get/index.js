const deps = require("./deps");

module.exports = ({ aggregateFn }) => {
  return async (req, res) => {
    const result = await aggregateFn(req.params.root);

    if (!result)
      throw deps.resourceNotFoundError.root({
        info: { root: req.params.root }
      });

    res.send(result);
  };
};
