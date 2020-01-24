const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

const deps = require("./deps");

module.exports = async ({ payload, context, aggregateFn }) => {
  // Create the root for this session.
  const root = await deps.uuid();

  if (context) {
    const { aggregate: previousSessionAggregate } = await aggregateFn(
      context.session
    );
    if (previousSessionAggregate.terminated) context = null;
  }

  // Create a token that is valid for one hour.
  const token = await deps.createJwt({
    options: {
      issuer: `session.${process.env.SERVICE}.${process.env.NETWORK}/start`,
      ...(context && context.principle && { subject: context.principle }),
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: NINETY_DAYS
    },
    payload: {
      context: {
        ...context,
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
        payload: {
          ...payload,
          started: deps.stringDate(),
          ...(context && {
            previous: context.session,
            ...(context.principle && {
              upgraded: deps.stringDate(),
              principle: context.principle
            }),
            ...(context.context && { context: context.context })
          })
        },
        correctNumber: 0
      }
    ],
    response: { token }
  };
};
