const { SECONDS_IN_HOUR: ONE_HOUR } = require("@blossm/duration-consts");
const { badRequest } = require("@blossm/errors");

const deps = require("./deps");

module.exports = async ({ root, payload, context, aggregateFn }) => {
  const { aggregate } = await aggregateFn(root);
  if (aggregate.terminated) throw badRequest.sessionTerminated();

  const token = await deps.createJwt({
    options: {
      issuer: `session.${process.env.SERVICE}.${process.env.NETWORK}/switch-context`,
      subject: context.principle,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: ONE_HOUR
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

  // console.log("das payload: ", payload);
  return {
    events: [{ root, payload }],
    response: { token }
  };
};
