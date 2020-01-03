const deps = require("./deps");

module.exports = ({ action, domain } = {}) => async (req, res) => {
  //eslint-disable-next-line
  console.log("posted to gateway: ", req.body);
  await deps.validate(req.body);
  const { root, payload, headers } = await deps.normalize(req.body);
  //eslint-disable-next-line
  console.log("stuffs: ", { root, payload, headers, context: req.context });
  const response = await deps
    .command({
      action,
      domain
    })
    .set({ tokenFn: deps.gcpToken, context: req.context })
    .issue(payload, { ...headers, root });

  res.status(200).send(response);
};
