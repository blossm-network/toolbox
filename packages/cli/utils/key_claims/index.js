const fact = require("@blossm/fact-rpc");
const { invalidCredentials } = require("@blossm/errors");
const { compare } = require("@blossm/crypt");

module.exports = ({ token }) => async ({ root, secret }) => {
  const { body: key } = await fact({
    name: "state",
    domain: "key",
    service: "system",
    ...(process.env.CORE_NETWORK && { network: process.env.CORE_NETWORK }),
  })
    .set({ token: { internalFn: token } })
    .read({ root });

  if (!key) throw invalidCredentials.message("This key wasn't found.");

  //TODO move this into the key.state fact. Send key over, don't receive.
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
      principal: key.principal,
      scene: key.scene,
    },
  };
};
