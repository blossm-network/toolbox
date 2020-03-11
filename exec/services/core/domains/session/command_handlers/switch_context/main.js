const deps = require("./deps");

module.exports = async ({ root, payload, context, session, aggregateFn }) => {
  // Get aggregates for the principle, this session, and the context to be switched in to.
  const [
    { aggregate: principleAggregate },
    { aggregate },
    { aggregate: contextAggregate }
  ] = await Promise.all([
    aggregateFn(session.sub, {
      domain: "principle"
    }),
    aggregateFn(root),
    aggregateFn(payload.context.root, {
      domain: "context"
    })
  ]);

  // Check to see if the principle has access to the context being switched in to.
  if (
    !principleAggregate.contexts.some(
      context =>
        context.root == payload.context.root &&
        context.service == payload.context.service &&
        context.network == payload.context.network
    )
  )
    throw deps.unauthorizedError.context({
      info: { context: payload.context }
    });

  // Check to see if this session has already been terminated.
  if (aggregate.terminated) throw deps.badRequestError.sessionTerminated();

  // Remove the old context domain.
  delete context[context.domain];

  // Create a new token inheriting from the current session.
  const token = await deps.createJwt({
    options: {
      issuer: session.iss,
      subject: session.sub,
      audience: session.aud,
      expiresIn: Date.parse(session.exp) - deps.fineTimestamp()
    },
    payload: {
      context: {
        ...context,
        context: payload.context,
        domain: contextAggregate.domain,
        [contextAggregate.domain]: {
          root: contextAggregate.root,
          service: contextAggregate.service,
          network: contextAggregate.network
        }
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
    events: [{ action: "switch-context", root, payload }],
    response: { tokens: { session: token } }
  };
};
