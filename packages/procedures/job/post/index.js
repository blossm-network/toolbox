module.exports = ({ mainFn }) => {
  return async (req, res) => {
    await mainFn({ payload: req.body.payload });

    //Add req.body.context as a fallback for internal testing without a gateway.
    // const context = req.context || req.body.context;

    res.status(204).send();
  };
};
