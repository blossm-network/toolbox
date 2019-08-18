const deps = require("./deps");

const { SECONDS_IN_MONTH } = require("@sustainer-network/consts");

const validate = require("./src/validate");
const clean = require("./src/clean");
const authorize = require("./src/authorize");
const version = require("./src/version");

const EVENT_TOPIC = "created.auth-token";

const SIX_MONTHS = 6 * SECONDS_IN_MONTH;

module.exports = async ({ body, serviceDomain, publishEventFn }) => {
  await authorize(body);
  await deps.cleanCommand(body);
  await clean(body);
  await deps.validateCommand(body);
  await validate(body);
  await deps.normalizeCommand(body);

  /**  side effects **/
  const root = await deps.newUuid();
  const token = await deps.createJwt({
    data: {
      root,
      issuerInfo: body.issuerInfo,
      account: body.payload.account,
      permissions: body.payload.permissions,
      metadata: body.payload.metadata
    },
    expiresIn: SIX_MONTHS,
    secret: process.env.secret
  });
  const event = await deps.createEvent(body, {
    version,
    topic: EVENT_TOPIC,
    serviceDomain,
    payload: {
      token,
      issuerInfo: body.issuerInfo,
      account: body.payload.account
    }
  });

  await publishEventFn(event);

  return { token };
};
