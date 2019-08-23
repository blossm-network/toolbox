const deps = require("../deps");

const { SECONDS_IN_MONTH } = require("@sustainer-network/consts");

const SIX_MONTHS = 6 * SECONDS_IN_MONTH;

module.exports = async params => {
  const root = await deps.newUuid();
  const token = await deps.createJwt({
    data: {
      root,
      issuerInfo: params.issuerInfo,
      account: params.payload.account,
      permissions: params.payload.permissions,
      metadata: params.payload.metadata
    },
    expiresIn: SIX_MONTHS,
    secret: process.env.SECRET
  });

  const payload = {
    token,
    issuerInfo: params.issuerInfo,
    account: params.payload.account
  };

  return { payload, response: { token } };
};
