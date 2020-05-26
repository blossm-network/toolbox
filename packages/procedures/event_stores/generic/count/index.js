module.exports = ({ countFn }) => {
  return async (req, res) => {
    const result = await countFn({
      root: req.params.root,
    });

    res.send(result);
  };
};
