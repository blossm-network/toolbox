const { MILLISECONDS_IN_DAY } = require("@blossm/duration-consts");

const NINETY_DAYS = 90 * MILLISECONDS_IN_DAY;

const deps = require("./deps");

module.exports = async ({ context }) => {
  const root = deps.uuid();

  const token = await deps.createJwt({
    options: {
      subject: context.principle.root,
      issuer: `connection.${process.env.SERVICE}.${process.env.NETWORK}/open`,
      audience: process.env.NETWORK,
      expiresIn: NINETY_DAYS
    },
    payload: {
      context: {
        ...context,
        connection: {
          root,
          service: process.env.SERVICE,
          network: process.env.NETWORK
        }
      }
    },
    signFn: deps.sign({
      ring: "jwt",
      key: "access",
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    })
  });

  return {
    events: [
      {
        action: "open",
        payload: {
          node: context.node,
          key: context.key,
          opened: deps.stringDate()
        },
        root,
        correctNumber: 0
      }
    ],
    response: {
      tokens: [{ network: process.env.NETWORK, type: "access", value: token }]
    }
  };
};
