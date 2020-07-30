const deps = require("./deps");

let cache = {};

module.exports = ({ credentialsFn }) => async ({ network, key }) => {
  const credentials = await credentialsFn({ network });
  if (!credentials) return null;
  const { root, secret } = credentials;
  const { token, exp } = cache[`${network}.${key}`] || {};
  if (!token || exp < new Date()) {
    const { headers } = await deps
      .command({
        name: "open",
        domain: "connection",
        service: "system",
        network,
      })
      .set({
        token: {
          externalFn: () =>
            deps.basicToken({
              root,
              secret,
            }),
          key: "access",
        },
      })
      .issue({ key });

    //TODO
    console.log({
      headers,
    });
    console.log({
      setcookie: headers["set-cookie"],
    });
    console.log({
      // parsed: headers["set-cookie"].map((c) => deps.parseCookie(c)),
      network,
      key,
    });

    const [{ value: token } = {}] = headers["set-cookie"]
      .map((c) => deps.parseCookie(c))
      .filter((c) => c.domain == network && c.name == key);

    //TODO
    console.log({ token });

    if (!token) return null;

    const claims = await deps.decode(token);
    cache[`${network}.${key}`] = {
      token,
      exp: new Date(Date.parse(claims.exp)),
    };
  }

  return { token: cache[`${network}.${key}`].token, type: "Bearer" };
};
