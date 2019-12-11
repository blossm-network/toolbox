module.exports = ({ mainFn }) => {
  return async (req, res) => {
    await mainFn({ payload: req.body.payload });
    res.status(204).send();
  };
};
