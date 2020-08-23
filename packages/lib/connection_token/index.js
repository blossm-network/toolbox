const deps = require("./deps");

const cacheKeyPrefix = "_cToken";
module.exports = ({ credentialsFn }) => async ({ network, key }) => {
  const credentials = await credentialsFn({ network });
  if (!credentials) return null;
  const cacheKey = `${cacheKeyPrefix}.${network}.${key}`;
  const { root, secret } = credentials;
  let { token, exp } = (await deps.redis.readObject(cacheKey)) || {};
  //TODO
  if (token) {
    console.log(`FOUND FOR ${cacheKey}`);
  } else {
    console.log(`NOT FOUND FOR ${cacheKey}`);
  }
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

    await deps.redis.writeObject(cacheKey, {
      token,
      exp,
    });

    //TODO
    console.log(`SAVED FOR ${cacheKey}`);
  }

  return {
    token,
    type: "Bearer",
  };
};
