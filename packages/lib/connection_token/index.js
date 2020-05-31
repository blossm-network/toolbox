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

    const cookies = deps.parseCookies({ headers });

    //TODO
    //eslint-disable-next-line no-console
    console.log({
      body,
      headers,
      cookies,
    });

    const [{ value: token } = {}] = cookies.filter(
      (c) => c.network == process.env.NETWORK
    );
    //TODO
    //eslint-disable-next-line no-console
    console.log({
      token,
    });
    const claims = await deps.decode(token);
    //TODO
    //eslint-disable-next-line no-console
    console.log({
      claims,
    });
    cache[network] = {
      token,
      exp: new Date(Date.parse(claims.exp)),
    };
  }

  return { token: cache[network].token, type: "Bearer" };
};
