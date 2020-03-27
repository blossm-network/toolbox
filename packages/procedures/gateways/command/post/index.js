const deps = require("./deps");

module.exports = ({ name, domain, tokenFn } = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { root, payload, headers } = await deps.normalize(req.body);
  const response = await deps
    .command({
      name,
      domain
    })
    .set({ tokenFn, context: req.context, claims: req.claims })
    .issue(payload, { ...headers, root });

  // If the response has tokens, send them as cookies and remove them from the response.
  if (response && response.tokens) {
    for (const token of response.tokens) {
      if (!token.network || !token.type || !token.value) continue;
      const cookieName = `${token.network}-${token.type}`;
      res.cookie(cookieName, token.value, {
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
