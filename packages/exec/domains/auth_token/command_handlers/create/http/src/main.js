const deps = require("../deps");

const { SECONDS_IN_DAY } = require("@sustainer-network/consts");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ params, context, signFn }) => {
  const root = await deps.newUuid();

  const isStaging = process.env.NODE_ENV == "staging";

  const issuer = `${process.env.ACTION}.${process.env.DOMAIN}.${
    process.env.SERVICE
  }.${isStaging ? "staging." : ""}${process.env.NETWORK}`;

  const token = await deps.createJwt({
    options: {
      issuer,
      subject: params.principle,
      audience: params.audiences.join(","),
      expiresIn: NINETY_DAYS
    },
    payload: {
      root,
      principle: params.principle,
      scopes: params.scopes,
      context: {
        ...params.context,
        ...(context != undefined && context),
        network: process.env.NETWORK
      }
    },
    signFn
  });

  const payload = {
    token,
    issuerInfo: params.issuerInfo
  };

  return { payload, response: { token } };
};
