const { conflict } = require("@sustainers/errors");
const { SECONDS_IN_DAY } = require("@sustainers/duration-consts");

const deps = require("./deps");

const NINETY_DAYS = 90 * SECONDS_IN_DAY;

module.exports = async ({ payload, context }) => {
  //Look for the challenge being answered.
  const challenge = await deps
    .viewStore({
      name: "codes",
      domain: "challenge",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
    .set({ context, tokenFn: deps.gcpToken })
    .read({ root: context.challenge });

  //Throw if no challenge recognized or if the code is not right.
  if (!challenge) throw conflict.codeNotRecognized;
  if (challenge.code != payload.code) throw conflict.wrongCode;

  //Throw if the challenge is expired.
  const now = new Date();

  if (Date.parse(challenge.expires) < now) throw conflict.codeExpired;

  //Lookup the contexts that the requesting person is in.
  const [person] = await deps
    .viewStore({
      name: "contexts",
      domain: "person",
      service: process.env.SERVICE,
      network: process.env.NETWORK
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
        person: context.person,
        //If the person is in only one context, add it to the token.
        ...(person &&
          person.contexts.length == 1 && {
          [person.contexts[0].type]: person.contexts[0].root
        })
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
