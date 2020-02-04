const deps = require("./deps");

module.exports = ({ action, domain } = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { root, payload, headers } = await deps.normalize(req.body);
  const response = await deps
    .command({
      action,
      domain
    })
    .set({ tokenFn: deps.gcpToken, context: req.context, session: req.session })
    .issue(payload, { ...headers, root });

  res.status(response ? 200 : 204).send(response);
};
