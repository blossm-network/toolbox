const deps = require("../deps");

const { SECONDS_IN_DAY } = require("@sustainers/consts");

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
      subject: params.payload.principle,
      audience: params.payload.audiences.join(","),
      expiresIn: NINETY_DAYS
    },
    payload: {
      root,
      principle: params.payload.principle,
      scopes: params.payload.scopes,
      context: {
        ...params.payload.context,
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
