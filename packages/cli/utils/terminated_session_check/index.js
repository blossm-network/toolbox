const fact = require("@blossm/fact-rpc");
const { invalidCredentials } = require("@blossm/errors");

module.exports = async ({ session, token: { internalFn, externalFn } }) => {
  const { body: terminated } = await fact({
    name: "terminated",
    domain: "session",
    service: session.service,
    network: session.network,
  })
    .set({
      token: {
        internalFn,
        externalFn,
      },
      context: { session },
    })
    .read();

  if (terminated)
    throw invalidCredentials.message("This token has already been terminated.");
};
