const { SECONDS_IN_HOUR: ONE_HOUR } = require("@blossm/duration-consts");

const deps = require("./deps");

module.exports = async ({ root, payload, context }) => {
  const token = await deps.createJwt({
    options: {
      issuer: `session.${process.env.SERVICE}.${process.env.NETWORK}/switch-context`,
      subject: context.principle,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: ONE_HOUR
    },
    payload: {
      context: {
        identity: context.idenity,
        context: payload.context
      }
    },
    signFn: deps.sign({
      ring: process.env.SERVICE,
      key: "auth",
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    })
  });

  return {
    events: [{ root, context: payload.context }],
    response: { token }
  };
};
