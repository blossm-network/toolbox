const deps = require("./deps");

let cache = {};

module.exports = ({ credentialsFn }) => async ({ network }) => {
  const credentials = await credentialsFn({ network });
  //TODO
  //eslint-disable-next-line no-console
  console.log({ credentials, network });
  if (!credentials) return null;
  const { root, secret } = credentials;
  const { token, exp } = cache[network] || {};
  if (!token || exp < new Date()) {
    //TODO
    //eslint-disable-next-line no-console
    console.log({
      external: deps.basicToken({
        root,
        secret,
      }),
    });
    const { body, headers } = await deps
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

    //TODO
    //eslint-disable-next-line no-console
    console.log({
      body,
      headers,
      cookieHeader: headers["set-cookie"],
    });

    const [{ value: token } = {}] = body.tokens.filter(
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
