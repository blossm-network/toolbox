const deps = require("./deps");

module.exports = async ({ root, payload, context, claims, aggregateFn }) => {
  // Get aggregates for the principle, this session, and the context to be switched in to.
  const [
    { aggregate: principleAggregate },
    { aggregate },
    { aggregate: sceneAggregate }
  ] = await Promise.all([
    aggregateFn(claims.sub, {
      domain: "principle"
    }),
    aggregateFn(root),
    aggregateFn(payload.scene.root, {
      domain: "scene"
    })
  ]);

  // Check to see if the principle has access to the context being switched in to.
  if (
    !principleAggregate.scenes.some(
      scene =>
        scene.root == payload.scene.root &&
        scene.service == payload.scene.service &&
        scene.network == payload.scene.network
    )
  )
    throw deps.unauthorizedError.message("This scene isn't accessible.", {
      info: { scene: payload.scene }
    });

  // Check to see if this session has already been terminated.
  if (aggregate.terminated) throw deps.badRequestError.sessionTerminated();

  // Remove the old context domain.
  delete context[context.domain];

  // Create a new token inheriting from the current session.
  const token = await deps.createJwt({
    options: {
      issuer: claims.iss,
      subject: claims.sub,
      audience: claims.aud,
      expiresIn: Date.parse(claims.exp) - deps.fineTimestamp()
    },
    payload: {
      context: {
        ...context,
        scene: payload.scene,
        domain: sceneAggregate.domain,
        [sceneAggregate.domain]: {
          root: sceneAggregate.root,
          service: sceneAggregate.service,
          network: sceneAggregate.network
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
    events: [{ action: "change-scene", root, payload }],
    response: { tokens: { session: token } }
  };
};
