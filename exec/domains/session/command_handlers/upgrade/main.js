const { SECONDS_IN_HOUR: ONE_HOUR } = require("@blossm/duration-consts");
const { badRequest } = require("@blossm/errors");

const deps = require("./deps");

module.exports = async ({ root, payload, context, aggregateFn }) => {
  const { aggregate } = await aggregateFn(root);

  if (aggregate.upgraded) throw badRequest.sessionAlreadyUpgraded;

  const token = await deps.createJwt({
    options: {
      issuer: `session.${process.env.SERVICE}.${process.env.NETWORK}/upgrade`,
      subject: payload.principle,
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

  return {
    events: [
      {
        root,
        payload: { upgraded: deps.stringDate(), principle: context.principle }
      }
    ],
    response: { token }
  };
};
