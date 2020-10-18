const fact = require("@blossm/fact-rpc");
const { invalidCredentials } = require("@blossm/errors");
const { compare } = require("@blossm/crypt");

//TODO write unit tests
module.exports = ({ token }) => async ({ root, secret }) => {
  const { body: key } = await fact({
    name: "state",
    domain: "key",
    service: "base",
    ...(process.env.BASE_NETWORK && { network: process.env.BASE_NETWORK }),
  })
    .set({ token: { internalFn: token } })
    .read({ root, query: { secret } });

  if (!key) throw invalidCredentials.message("This key wasn't found.");

  if (!(await compare(secret, key.secret)))
    throw invalidCredentials.message("This secret isn't right.");

  return {
    context: {
      network: key.network,
      key: {
        root: key.root,
        service: "base",
        network: process.env.NETWORK,
      },
      principal: key.principal,
      scene: key.scene,
      ...(key.domain && {
        [key.domain.name]: {
          root: key.domain.root,
          service: key.domain.service,
          network: key.domain.network,
        },
      }),
    },
  };
};
