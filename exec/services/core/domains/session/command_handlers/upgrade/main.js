const deps = require("./deps");

module.exports = async ({ root, payload, context, claims, aggregateFn }) => {
  // Get the aggregate for this session.
  const { aggregate: sessionAggregate } = await aggregateFn(root);

  // Check to see if this session has already been terminated.
  if (sessionAggregate.terminated)
    throw deps.badRequestError.sessionTerminated();

  // Check to see if this session has already been upgraded.
  if (sessionAggregate.upgraded)
    throw deps.badRequestError.sessionAlreadyUpgraded();

  // Create a new token inheriting from the current claims.
  const token = await deps.createJwt({
    options: {
      issuer: claims.iss,
      subject: payload.principle,
      audience: claims.aud,
      expiresIn: Date.parse(claims.exp) - deps.fineTimestamp()
    },
    payload: {
      context: {
        ...context,
        principle: {
          root: payload.principle,
          service: process.env.SERVICE,
          network: process.env.NETWORK
        }
      }
    },
    signFn: deps.sign({
      ring: "jwt",
      key: "access",
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
        payload: {
          upgraded: deps.stringDate(),
          principle: {
            root: payload.principle,
            service: process.env.SERVICE,
            network: process.env.NETWORK
          }
        }
      },
      {
        root: payload.principle,
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
