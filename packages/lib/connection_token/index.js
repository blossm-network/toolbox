const deps = require("./deps");

let cache = {};

module.exports = ({ credentialsFn }) => async ({ network }) => {
  const { id, secret } = await credentialsFn({ network });
  const { token, exp } = cache[network] || {};
  if (!token || exp < new Date()) {
    const { tokens } = await deps
      .command({
        name: "open",
        domain: "connection",
        service: "system",
        network
      })
      .set({
        tokenFns: {
          external: () =>
            deps.basicToken({
              id,
              secret
            })
        }
      })
      .issue();

    //TODO
    //eslint-disable-next-line no-console
    console.log({ tokens });
    const [{ value: token } = {}] = tokens.filter(
      t => t.network == process.env.NETWORK
    );
    //TODO
    //eslint-disable-next-line no-console
    console.log({ token });
    const claims = await deps.decode(token);
    //TODO
    //eslint-disable-next-line no-console
    console.log({ claims });
    cache[network] = {
      token,
      exp: Date.parse(claims.exp)
    };
  }

  //TODO
  //eslint-disable-next-line no-console
  console.log({ returnedRouterConnectionToke: cache[network] });
  return { token: cache[network].token, type: "Bearer" };
};
