const deps = require("./deps");

let cache = {};

module.exports = ({ credentialsFn }) => async ({ network }) => {
  const credentials = await credentialsFn({ network });
  if (!credentials) return null;
  const { root, secret } = credentials;
  const { token, exp } = cache[network] || {};
  if (!token || exp < new Date()) {
    const { headers } = await deps
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
              root,
              secret,
            }),
        },
      })
      .issue();

    const cookies = deps.parseCookies({ headers });

    const [{ value: token } = {}] = cookies.filter(
      (c) => c.domain == network && c.name == "access"
    );

    if (!token) return null;

    const claims = await deps.decode(token);
    cache[network] = {
      token,
      exp: new Date(Date.parse(claims.exp)),
    };
  }

  return { token: cache[network].token, type: "Bearer" };
};
