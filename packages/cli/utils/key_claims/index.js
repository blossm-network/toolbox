const fact = require("@blossm/fact-rpc");
const { invalidCredentials } = require("@blossm/errors");
const { compare } = require("@blossm/crypt");

module.exports = ({ token }) => async ({ id, secret }) => {
  const { body: key } = await fact({
    name: "state",
    domain: "key",
    service: "system",
    ...(process.env.CORE_NETWORK && { network: process.env.CORE_NETWORK }),
  })
    .set({ tokenFns: { internal: token } })
    .read({ id });

  if (!key) throw invalidCredentials.message("This key wasn't found.");

  if (!(await compare(secret, key.secret)))
    throw invalidCredentials.message("This secret isn't right.");

  return {
    context: {
      network: key.network,
      key: {
        root: key.root,
        service: "system",
        network: process.env.NETWORK,
      },
      principle: key.principle,
      scene: key.scene,
    },
  };
};
