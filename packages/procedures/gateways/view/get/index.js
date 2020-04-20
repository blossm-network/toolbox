const deps = require("./deps");

module.exports = ({ name, domain, service } = {}) => async (req, res) => {
  const { body: response } = await deps
    .viewStore({
      name,
      ...(domain && { domain }),
      ...(service && { service }),
    })
    .set({
      tokenFns: { internal: deps.gcpToken },
      context: req.context,
      claims: req.claims,
    })
    .read(req.query);

  res.status(200).send({ content: response });
};
