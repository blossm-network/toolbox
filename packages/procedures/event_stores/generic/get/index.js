const deps = require("./deps");

module.exports = ({ findOneFn }) => {
  return async (req, res) => {
    const result = await findOneFn({
      root: req.params.root
    });

    if (!result) throw deps.resourceNotFoundError.root();

    res.send(result);
  };
};
