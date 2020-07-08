module.exports = ({ countFn }) => async (req, res) => {
  const result = await countFn({
    root: req.params.root,
  });

  res.send({ count: result });
};
