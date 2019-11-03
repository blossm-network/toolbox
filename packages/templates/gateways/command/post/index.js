const deps = require("./deps");

module.exports = ({ action, domain } = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { payload, headers } = await deps.normalize(req.body);
  const response = await deps
    .command({
      action: req.params.action || action,
      domain: req.params.domain || domain,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
    .set({ tokenFn: deps.gcpToken, context: req.context })
    .issue(payload, headers);

  res.status(200).send(response);
};
