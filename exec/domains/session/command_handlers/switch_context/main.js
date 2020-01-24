const { badRequest } = require("@blossm/errors");

const deps = require("./deps");

module.exports = async ({ root, payload, context, session, aggregateFn }) => {
  // TODO very that the principle is allowed to switch

  const { aggregate } = await aggregateFn(root);
  if (aggregate.terminated) throw badRequest.sessionTerminated();

  const { aggregate: contextAggregate } = await aggregateFn(payload.context, {
    domain: "context"
  });

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
    events: [{ root, payload }],
    response: { token }
  };
};
