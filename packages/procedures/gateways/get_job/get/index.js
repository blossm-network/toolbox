const deps = require("./deps");

module.exports = ({ name, domain } = {}) => async (req, res) => {
  const response = await deps
    .getJob({
      name,
      domain
    })
    .set({ tokenFn: deps.gcpToken, context: req.context, claims: req.claims })
    .read(req.query);

  res.status(200).send(response);
};
