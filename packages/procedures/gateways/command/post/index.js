const deps = require("./deps");

module.exports = ({ name, domain } = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { root, payload, headers } = await deps.normalize(req.body);
  let response = await deps
    .command({
      name,
      domain
    })
    .set({ tokenFn: deps.gcpToken, context: req.context, claims: req.claims })
    .issue(payload, { ...headers, root });

  // If the response has tokens, send them as cookies and remove them from the response.
  if (response && response.tokens) {
    for (const token in response.tokens) {
      res.cookie(token, response.tokens[token], {
        httpOnly: true,
        secure: true
      });
    }
    // // If removing tokens makes the response empty, set it to null to properly return a 204.
    // if (Object.keys(response).length == 1) {
    //   response = null;
    // } else {
    //   delete response.tokens;
    // }
  }

  res.status(response ? 200 : 204).send(response);
};
