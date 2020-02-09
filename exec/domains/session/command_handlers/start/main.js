const { MILLISECONDS_IN_DAY } = require("@blossm/duration-consts");

const NINETY_DAYS = 90 * MILLISECONDS_IN_DAY;

const deps = require("./deps");

module.exports = async ({ payload }) => {
  // Create the root for this session.
  const root = await deps.uuid();

  // Create a long-lived token.
  const token = await deps.createJwt({
    options: {
      issuer: `session.${process.env.SERVICE}.${process.env.NETWORK}/start`,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: NINETY_DAYS
    },
    payload: {
      context: {
        session: root,
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

  return {
    events: [
      {
        root,
        action: "start",
        payload: {
          ...payload,
          started: deps.stringDate()
        },
        correctNumber: 0
      }
    ],
    response: { tokens: { session: token } }
  };
};
