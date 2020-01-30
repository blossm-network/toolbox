const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ payload, context, aggregateFn }) => {
  const root = context.challenge;

  //Look for the challenge being answered.
  const { aggregate: challengeAggregate } = await aggregateFn(root);

  // Throw if the code is wrong.
  if (challengeAggregate.code != payload.code)
    throw deps.invalidArgumentError.wrongCode();

  //Throw if the challenge is expired.
  const now = new Date();

  // Throw if the code is expired.
  if (Date.parse(challengeAggregate.expires) < now)
    throw deps.invalidArgumentError.codeExpired();

  //Create a token that can access commands and views.
  const token = await deps.createJwt({
    options: {
      issuer: `answer.challenge.${process.env.SERVICE}.${process.env.NETWORK}`,
      subject: challengeAggregate.principle,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: NINETY_DAYS
    },
    payload: {
      context: {
        ...context,
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
          answered: deps.stringDate()
        },
        correctNumber: 1
      },
      ...(challengeAggregate.events || [])
    ],
    response: { token }
  };
};
