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
    aggregateFn(payload.context, {
      domain: "context"
    })
  ]);

  // Check to see if the principle has access to the context being switched in to.
  if (
    !principleAggregate.permissions.some(
      priviledge =>
        priviledge.startsWith("context:") &&
        priviledge.endsWith(`:${payload.context}`)
    )
  )
    throw deps.unauthorizedError.context({
      info: { context: payload.context }
    });

  // Check to see if this session has already been terminated.
  if (aggregate.terminated) throw deps.badRequestError.sessionTerminated();

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
        root: contextAggregate.root
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
    events: [{ action: "switch-context", root, payload }],
    response: { tokens: { session: token } }
  };
};
