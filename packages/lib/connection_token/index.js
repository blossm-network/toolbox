const deps = require("./deps");

let cache = {};

module.exports = ({ credentialsFn }) => async ({ network, key }) => {
  const credentials = await credentialsFn({ network });
  if (!credentials) return null;
  const { root, secret } = credentials;
  const { token, exp } = cache[`${network}.${key}`] || {};
  if (!token || exp < new Date()) {
    const {
      body: { token },
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
              root,
              secret,
            }),
        },
      })
      .issue({ key });

    if (!token) return null;

    const claims = await deps.decode(token.value);
    cache[`${network}.${key}`] = {
      token: token.value,
      exp: new Date(Date.parse(claims.exp)),
    };
  }

  return { token: cache[`${network}.${key}`].token, type: "Bearer" };
};
