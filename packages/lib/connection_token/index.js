const deps = require("./deps");

const cacheKeyPrefix = "_cToken";
const WEEK_IN_SECONDS = 604800;

module.exports = ({ credentialsFn }) => async ({ network, key }) => {
  const cacheKey = `${cacheKeyPrefix}.${network}.${key}`;
  let token;
  let exp;
  //TODO
  // let { token, exp } = (await deps.redis.readObject(cacheKey)) || {};
  // if (!token || new Date(Date.parse(exp)) < new Date()) {
  const credentials = await credentialsFn({ network });
  if (!credentials) return null;
  const { root, secret } = credentials;
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
  // }
  await deps.redis.setExpiry(cacheKey, {
    seconds: WEEK_IN_SECONDS,
  });

  return {
    token,
    type: "Bearer",
  };
};
