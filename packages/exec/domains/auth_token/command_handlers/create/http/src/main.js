const deps = require("../deps");

const { SECONDS_IN_MONTH } = require("@sustainer-network/consts");

const SIX_MONTHS = 6 * SECONDS_IN_MONTH;

const stringsFromAudience = audience =>
  audience.map(
    audience =>
      `${audience.service}:${audience.domain}:${audience.root}:${audience.scope}`
  );

module.exports = async params => {
  const root = await deps.newUuid();
  const token = await deps.createJwt({
    options: {
      issuer: params.payload.issuer,
      subject: params.payload.subject,
      audience: stringsFromAudience(params.payload.audience),
      expiresIn: SIX_MONTHS
    },
    data: {
      root,
      ...params.payload.metadata
    },
    secret: process.env.SECRET
  });

  const payload = {
    token,
    issuerInfo: params.issuerInfo
  };

  return { payload, response: { token } };
};
