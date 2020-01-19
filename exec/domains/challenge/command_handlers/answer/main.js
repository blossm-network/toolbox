const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ payload, context, aggregateFn }) => {
  const root = context.challenge;

  //Look for the challenge being answered.
  const { aggregate: challenge } = await aggregateFn(root);

  //Throw if no challenge recognized or if the code is not right.
  if (!challenge) throw deps.invalidArgumentError.codeNotRecognized();

  if (challenge.code != payload.code)
    throw deps.invalidArgumentError.wrongCode();

  //Throw if the challenge is expired.
  const now = new Date();

  if (Date.parse(challenge.expires) < now)
    throw deps.invalidArgumentError.codeExpired();

  //eslint-disable-next-line
  console.log("condext: ", context);
  //Lookup the contexts that the requesting identity is in.
  const { aggregate: identity } = aggregateFn(context.identity, {
    domain: "identity"
  });
  //eslint-disable-next-line
  console.log("iden: ", identity);

  //Create a token that can access commands and views.
  const token = await deps.createJwt({
    options: {
      issuer: `answer.challenge.${process.env.SERVICE}.${process.env.NETWORK}`,
      subject: identity.principle,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: NINETY_DAYS
    },
    payload: {
      context: {
        //If the identity is in only one context, add it to the token.
        ...(identity &&
          identity.contexts.length == 1 && {
            context: identity.contexts[0]
          }),
        ...context,
        identity: identity.root,
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
