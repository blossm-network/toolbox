const deps = require("./deps");

module.exports = async ({ payload, context, aggregateFn }) => {
  const root = context.challenge;

  // Look for the challenge being answered.
  const { aggregate: challengeAggregate } = await aggregateFn(root);

  // Throw if the code is wrong.
  if (challengeAggregate.code != payload.code)
    throw deps.invalidArgumentError.wrongCode();

  // Throw if the challenge is expired.
  const now = new Date();

  // Throw if the code is expired.
  if (Date.parse(challengeAggregate.expires) < now)
    throw deps.invalidArgumentError.codeExpired();

  const events = [
    {
      root,
      action: "answer",
      payload: {
        answered: deps.stringDate()
      },
      correctNumber: 1
    },
    ...(challengeAggregate.events || [])
  ];

  // If there's already a subject associated with this session, no need to upgrade the session.
  if (challengeAggregate.session.sub) return { events };

  // Upgrade the session with the principle specified in the challenge.
  const { tokens } = await deps
    .command({
      domain: "session",
      name: "upgrade"
    })
    .set({
      context,
      session: challengeAggregate.session,
      tokenFn: deps.gcpToken
    })
    .issue(
      {
        principle: challengeAggregate.principle
      },
      { root: context.session }
    );

  return { events, response: { tokens } };
};
