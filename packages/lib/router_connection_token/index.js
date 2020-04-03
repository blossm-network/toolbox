const deps = require("./deps");

let cache = {};

module.exports = ({ routerNetwork, routerKeyId, routerKeySecret }) => async ({
  network
}) => {
  const { token, exp } = cache[network] || {};
  if (!token || exp < new Date()) {
    const { tokens } = await deps
      .command({
        name: "open",
        domain: "connection",
        service: "router",
        network: routerNetwork
      })
      .set({
        tokenFn: deps.basicToken({
          id: routerKeyId,
          secret: routerKeySecret
        })
      })
      .issue({
        networks: [network]
      });
    const { value: token } = tokens.filter(t => t.network == routerNetwork)[0];
    const claims = await deps.validate({ token });
    cache[network] = {
      token,
      exp: Date.parse(claims.exp)
    };
  }
  return cache[network].token;
};
