const deps = require("./deps");

let cache = {};

module.exports = ({ credentialsFn }) => async ({ network }) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log("O");
  const credentials = await credentialsFn({ network });
  //TODO
  //eslint-disable-next-line no-console
  console.log("P", credentials);
  if (!credentials) return null;
  const { id, secret } = credentials;
  const { token, exp } = cache[network] || {};
  if (!token || exp < new Date()) {
    //TODO
    //eslint-disable-next-line no-console
    console.log("Q");
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

    //TODO
    //eslint-disable-next-line no-console
    console.log("R");
    const [{ value: token } = {}] = tokens.filter(
      (t) => t.network == process.env.NETWORK
    );
    const claims = await deps.decode(token);
    cache[network] = {
      token,
      exp: new Date(Date.parse(claims.exp)),
    };
  }

  //TODO
  //eslint-disable-next-line no-console
  console.log("S");
  return { token: cache[network].token, type: "Bearer" };
};
