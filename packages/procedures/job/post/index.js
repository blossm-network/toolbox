module.exports = ({ mainFn }) => {
  return async (req, res) => {
    await mainFn({
      payload: req.body.payload,
      ...(req.body.context && { context: req.body.context }),
      ...(req.body.session && { session: req.body.session })
    });

    res.status(204).send();
  };
};
