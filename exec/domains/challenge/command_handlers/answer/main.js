const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

const deps = require("./deps");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ payload, root, context }) => {
  //Look for the challenge being answered.
  const challenge = await deps
    .viewStore({
      name: "codes",
      domain: "challenge"
    })
    .set({ context, tokenFn: deps.gcpToken })
    .read({ root });

  //Throw if no challenge recognized or if the code is not right.
  if (!challenge) throw deps.invalidArgumentError.codeNotRecognized();

  if (challenge.code != payload.code)
    throw deps.invalidArgumentError.wrongCode();

  //Throw if the challenge is expired.
  const now = new Date();

  if (Date.parse(challenge.expires) < now)
    throw deps.badRequestError.codeExpired();

  //Lookup the contexts that the requesting user is in.
  const [user] = await deps
    .viewStore({
      name: "contexts",
      domain: "user"
    })
    .set({ context, tokenFn: deps.gcpToken })
    .read({ code: payload.code });

  //Create a token that can access commands and views.
  const token = await deps.createJwt({
    options: {
      issuer: `answer.challenge.${process.env.SERVICE}.${process.env.NETWORK}`,
      subject: context.principle,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: NINETY_DAYS
    },
    payload: {
      principle: context.principle,
      context: {
        user: context.user,
        //If the user is in only one context, add it to the token.
        ...(user &&
          user.contexts.length == 1 && {
            [user.contexts[0].type]: user.contexts[0].root
          }),
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

  return { payload: { answered: deps.stringDate() }, response: { token } };
};
