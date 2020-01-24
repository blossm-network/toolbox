const { badRequest } = require("@blossm/errors");

const deps = require("./deps");

module.exports = async ({ root, payload, context, session, aggregateFn }) => {
  const { aggregate } = await aggregateFn(root);

  if (aggregate.upgraded) throw badRequest.sessionAlreadyUpgraded;

  const token = await deps.createJwt({
    options: {
      issuer: session.iss,
      subject: payload.principle,
      audience: session.aud,
      expiresIn: Date.parse(session.exp) - deps.fineTimestamp()
    },
    payload: { context },
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
        payload: { upgraded: deps.stringDate(), principle: payload.principle }
      }
    ],
    response: { token }
  };
};
