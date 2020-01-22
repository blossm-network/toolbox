const { SECONDS_IN_HOUR: ONE_HOUR } = require("@blossm/duration-consts");
const { badRequest } = require("@blossm/errors");

const deps = require("./deps");

module.exports = async ({ root, context, aggregateFn }) => {
  const { aggregate } = await aggregateFn(root);

  if (aggregate.ended) throw badRequest.cantExtendEndedSession;

  const token = await deps.createJwt({
    options: {
      issuer: `session.${process.env.SERVICE}.${process.env.NETWORK}/extend`,
      subject: context.principle,
      audience: `${process.env.SERVICE}.${process.env.NETWORK}`,
      expiresIn: ONE_HOUR
    },
    payload: { context },
    signFn: deps.sign({
      ring: process.env.SERVICE,
      key: "auth",
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    })
  });

  return { events: [{ extended: deps.stringDate() }], response: { token } };
};
