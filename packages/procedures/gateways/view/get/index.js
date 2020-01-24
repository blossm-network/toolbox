const deps = require("./deps");

module.exports = ({ name, domain } = {}) => async (req, res) => {
  const response = await deps
    .viewStore({
      name,
      domain
    })
    .set({ tokenFn: deps.gcpToken, context: req.context, session: req.session })
    .read(req.query);

  res.status(200).send(response);
};
