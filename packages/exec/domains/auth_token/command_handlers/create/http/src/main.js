const deps = require("../deps");
const { action, domain, service } = require("./config");

const { SECONDS_IN_DAY } = require("@sustainer-network/consts");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ params, context }) => {
  const root = await deps.newUuid();

  const isStaging = process.env.NODE_ENV == "staging";

  const issuer = `${action}.${domain}.${service}.${
    isStaging ? "staging." : ""
  }${process.env.NETWORK}`;

  const token = await deps.createJwt({
    options: {
      issuer,
      subject: params.principle,
      audience: params.audiences.join(","),
      expiresIn: NINETY_DAYS
    },
    data: {
      root,
      principle: params.principle,
      scopes: params.scopes,
      context: {
        ...params.context,
        ...(context != undefined && context),
        network: process.env.NETWORK
      }
    },
    secret: process.env.SECRET
  });

  const payload = {
    token,
    issuerInfo: params.issuerInfo
  };

  return { payload, response: { token } };
};
