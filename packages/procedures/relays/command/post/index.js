const deps = require("./deps");

module.exports = ({ tokenFn }) => async (req, res) => {
  //TODO
  //eslint-disable-next-line
  console.log({ body: req.body });
  const { root, name, domain, service, host, payload, headers } = req.body;

  //TODO
  //eslint-disable-next-line
  console.log({ root, name, domain, service, host, payload, headers });

  const response = await deps
    .command({
      name,
      domain,
      service,
      host
    })
    .set({ tokenFn, context: req.context })
    .issue(payload, { ...headers, root });

  //TODO
  //eslint-disable-next-line
  console.log({ response });

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
    // If removing tokens makes the response empty, set it to null to properly return a 204.
    // if (Object.keys(response).length == 1) {
    //   response = null;
    // } else {
    //   delete response.tokens;
    // }
  }

  res.status(response ? 200 : 204).send(response);
};
