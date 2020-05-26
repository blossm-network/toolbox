module.exports = ({ rootCountFn }) => {
  return async (req, res) => {
    const result = await rootCountFn({
      root: req.params.root,
    });

    res.send(result);
  };
};
