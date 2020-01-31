const deps = require("./deps");

module.exports = async ({ payload, context, session, aggregateFn }) => {
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
  const { token } = await deps
    .command({
      domain: "session",
      action: "upgrade"
    })
    .set({ context, session, tokenFn: deps.gcpToken })
    .issue(
      {
        principle: challengeAggregate.principle
      },
      { root: context.session }
    );

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
