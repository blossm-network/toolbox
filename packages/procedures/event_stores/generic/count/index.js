module.exports = ({ countFn }) => {
  return async (req, res) => {
    const result = await countFn({
      root: req.params.root,
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ params: req.params, result });
    res.send(result);
  };
};
