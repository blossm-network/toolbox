const deps = require("./deps");

const cacheKeyPrefix = "_cToken";
module.exports = ({ credentialsFn }) => async ({ network, key }) => {
  const credentials = await credentialsFn({ network });
  if (!credentials) return null;
  const { root, secret } = credentials;
  let { token, exp } =
    (await deps.redis.readObject(`${cacheKeyPrefix}.${network}.${key}`)) || {};
  if (!token || new Date(Date.parse(exp)) < new Date()) {
    const {
      body: { token: newToken },
    } = await deps
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

    if (!newToken) return null;

    const claims = await deps.decode(newToken.value);
    token = newToken.value;
    exp = new Date(Date.parse(claims.exp));

    await deps.redis.writeObject(`${cacheKeyPrefix}.${network}.${key}`, {
      token,
      exp,
    });
  }

  return {
    token,
    type: "Bearer",
  };
};
