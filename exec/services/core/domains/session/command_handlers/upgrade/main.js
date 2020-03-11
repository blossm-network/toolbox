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
      subject: payload.principle.root,
      audience: session.aud,
      expiresIn: Date.parse(session.exp) - deps.fineTimestamp()
    },
    payload: {
      context: {
        ...context,
        principle: payload.principle
      }
    },
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
        root: payload.principle.root,
        domain: "principle",
        action: "add-roles",
        payload: {
          roles: [
            {
              id: "SessionAdmin",
              service: process.env.SERVICE,
              network: process.env.NETWORK
            }
          ]
        }
      }
    ],
    response: { tokens: { session: token } }
  };
};
