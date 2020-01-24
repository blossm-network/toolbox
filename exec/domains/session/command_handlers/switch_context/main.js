const { badRequest } = require("@blossm/errors");

const deps = require("./deps");

module.exports = async ({ root, payload, context, session, aggregateFn }) => {
  const { aggregate } = await aggregateFn(root);
  if (aggregate.terminated) throw badRequest.sessionTerminated();

  const token = await deps.createJwt({
    options: {
      issuer: session.iss,
      subject: session.sub,
      audience: session.aud,
      expiresIn: Date.parse(session.exp) - deps.fineTimestamp()
    },
    payload: {
      context: {
        identity: context.identity,
        context: payload.context,
        session: context.session,
        service: process.env.SERVICE,
        network: process.env.NETWORK
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
