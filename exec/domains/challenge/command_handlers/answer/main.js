const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ payload, context, aggregateFn }) => {
  const root = context.challenge;

  //Look for the challenge being answered.
  const aggregateResult = await aggregateFn(root);

  //Throw if no challenge recognized or if the code is not right.
  if (!aggregateResult) throw deps.invalidArgumentError.codeNotRecognized();

  const challenge = aggregateResult.aggregate;

  if (challenge.code != payload.code)
    throw deps.invalidArgumentError.wrongCode();

  //Throw if the challenge is expired.
  const now = new Date();

  if (Date.parse(challenge.expires) < now)
    throw deps.invalidArgumentError.codeExpired();

  //Lookup the contexts that the requesting identity is in to get the principle.
  const {
    aggregate: { principle }
  } = await aggregateFn(context.identity, {
    domain: "identity"
  });

  //Create a token that can access commands and views.
  const token = await deps.createJwt({
    options: {
      issuer: `answer.challenge.${process.env.SERVICE}.${process.env.NETWORK}`,
      subject: principle,
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
      ...(challenge.events || [])
    ],
    response: { token }
  };
};
