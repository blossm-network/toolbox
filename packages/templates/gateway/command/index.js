const deps = require("./deps");

module.exports = () => {
  return async (req, res) => {
    await deps.validate(req.body);
    const { payload, headers } = await deps.normalize(req.body);
    await deps
      .command({
        action: req.params.action,
        domain: req.params.domain,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      .set({ context: req.context, tokenFn: deps.gcpToken })
      .issue(payload, headers);

    res.status(204).send();
  };
};
