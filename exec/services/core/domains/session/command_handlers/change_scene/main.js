const deps = require("./deps");

module.exports = async ({ payload, context, claims, aggregateFn }) => {
  // Get aggregates for the principle, this session, and the context to be switched in to.
  const [
    { aggregate: principleAggregate },
    { aggregate },
    { aggregate: sceneAggregate }
  ] = await Promise.all([
    aggregateFn(claims.sub, {
      domain: "principle"
    }),
    aggregateFn(context.session.root),
    aggregateFn(payload.scene, {
      domain: "scene"
    })
  ]);

  // Check to see if the principle has access to the context being switched in to.
  if (!principleAggregate.scenes.some(scene => scene.root == payload.scene))
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
        scene: {
          root: payload.scene,
          service: sceneAggregate.service,
          network: sceneAggregate.network
        },
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
    events: [
      {
        action: "change-scene",
        root: context.session.root,
        payload: {
          scene: {
            root: payload.scene,
            service: process.env.SERVICE,
            network: process.env.NETWORK
          }
        }
      }
    ],
    response: { tokens: { session: token } }
  };
};
