const deps = require("../deps");

const { SECONDS_IN_MONTH } = require("@sustainer-network/consts");

const SIX_MONTHS = 6 * SECONDS_IN_MONTH;

module.exports = async ({ body }) => {
  const root = await deps.newUuid();
  const token = await deps.createJwt({
    data: {
      root,
      issuerInfo: body.issuerInfo,
      account: body.payload.account,
      permissions: body.payload.permissions,
      metadata: body.payload.metadata
    },
    expiresIn: SIX_MONTHS,
    secret: process.env.SECRET
  });

  const payload = {
    token,
    issuerInfo: body.issuerInfo,
    account: body.payload.account
  };

  return { payload, response: { token } };
};
