const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ payload, context, root }) => {
  const token = await deps.createJwt({
    options: {
      issuer: `enter.context.${process.env.SERVICE}.${process.env.NETWORK}`,
      subject: context.principle,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: NINETY_DAYS
    },
    payload: {
      context: {
        ...context,
        context: root
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

  return { events: [{ payload, root }], response: { token } };
};
