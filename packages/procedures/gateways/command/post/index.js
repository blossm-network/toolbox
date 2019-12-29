const deps = require("./deps");

module.exports = ({ action, domain } = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { root, payload, headers } = await deps.normalize(req.body);
  const response = await deps
    .command({
      action,
      domain
    })
    .set({ tokenFn: deps.gcpToken, context: req.context })
    .issue(payload, { ...headers, root });

  res.status(200).send(response);
};
