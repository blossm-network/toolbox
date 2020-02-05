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

  // if (response.tokens) {
  //   for (const token in response.tokens) {
  //     res.cookie(token, response.tokens[token], {
  //       httpOnly: true,
  //       secure: true
  //     });
  //   }
  //   delete response.tokens;
  // }
  res.cookie("some-key", "some-value", {
    httpOnly: true,
    secure: true
  });

  res.status(response ? 200 : 204).send(response);
};
