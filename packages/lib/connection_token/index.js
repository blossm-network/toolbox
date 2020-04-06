const deps = require("./deps");

let cache = {};

module.exports = ({ coreNetwork, credentialsFn }) => async ({ network }) => {
  const { token, exp } = cache[network] || {};
  if (!token || exp < new Date()) {
    const { tokens } = await deps
      .command({
        name: "open",
        domain: "connection",
        service: "system",
        network: coreNetwork
      })
      .set({
        tokenFn: deps.basicToken({
          ...credentialsFn({ network })
        })
      });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ tokens });
    const [{ value: token } = {}] = tokens.filter(
      t => t.network == process.env.NETWORK
    );
    //TODO
    //eslint-disable-next-line no-console
    console.log({ token });
    const claims = await deps.validate({ token });
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
  return cache[network].token;
};
