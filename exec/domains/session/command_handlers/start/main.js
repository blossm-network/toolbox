const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ payload, context }) => {
  //Create the root for this session.
  const root = await deps.uuid();

  const token = await deps.createJwt({
    options: {
      issuer: `start.session.${process.env.SERVICE}.${process.env.NETWORK}`,
      ...(context && { subject: context.principle }),
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: NINETY_DAYS
    },
    payload: {
      context: context || {
        service: process.env.SERVICE,
        network: process.env.NETWORK
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
