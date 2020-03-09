const deps = require("./deps");

module.exports = async ({ root, payload, context, session, aggregateFn }) => {
  // Get the aggregate for this session.
  const { aggregate: sessionAggregate } = await aggregateFn(root);

  // Check to see if this session has already been terminated.
  if (sessionAggregate.terminated)
    throw deps.badRequestError.sessionTerminated();

  // Check to see if this session has already been upgraded.
  if (sessionAggregate.upgraded)
    throw deps.badRequestError.sessionAlreadyUpgraded();

  // Create a new token inheriting from the current session.
  const token = await deps.createJwt({
    options: {
      issuer: session.iss,
      subject: payload.principle,
      audience: session.aud,
      expiresIn: Date.parse(session.exp) - deps.fineTimestamp()
    },
    payload: { context },
    signFn: deps.sign({
      ring: "jwt",
      key: "session",
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    })
  });

  return {
    events: [
      {
        root,
        action: "upgrade",
        payload: { upgraded: deps.stringDate(), principle: payload.principle }
      },
      {
        root: payload.principle,
        domain: "principle",
        action: "add-roles",
        payload: { roles: ["SessionAdmin"] }
      }
    ],
    response: { tokens: { session: token } }
  };
};
