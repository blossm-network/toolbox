const deps = require("./deps");

let cache = {};

module.exports = ({ credentialsFn }) => async ({ network }) => {
  const credentials = await credentialsFn({ network });
  if (!credentials) return null;
  const { id, secret } = credentials;
  const { token, exp } = cache[network] || {};
  if (!token || exp < new Date()) {
    const {
      body: { tokens },
    } = await deps
      .command({
        name: "open",
        domain: "connection",
        service: "system",
        network,
      })
      .set({
        tokenFns: {
          external: () =>
            deps.basicToken({
              id,
              secret,
            }),
        },
      })
      .issue();

    const [{ value: token } = {}] = tokens.filter(
      (t) => t.network == process.env.NETWORK
    );
    const claims = await deps.decode(token);
    cache[network] = {
      token,
      exp: new Date(Date.parse(claims.exp)),
    };
  }

  return { token: cache[network].token, type: "Bearer" };
};
