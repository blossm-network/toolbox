const deps = require("./deps");

module.exports = ({ action, domain } = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { root, payload, headers } = await deps.normalize(req.body);
  let response = await deps
    .command({
      action,
      domain
    })
    .set({ tokenFn: deps.gcpToken, context: req.context, session: req.session })
    .issue(payload, { ...headers, root });

  if (response && response.tokens) {
    for (const token in response.tokens) {
      res.cookie(token, response.tokens[token], {
        httpOnly: true,
        secure: true
      });
    }
    if (Object.keys(response).length == 1) {
      response = null;
    } else {
      delete response.tokens;
    }
  }

  res.status(response ? 200 : 204).send(response);
};
