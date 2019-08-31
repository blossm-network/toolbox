const deps = require("./deps");

const priviledges = require("./src/priviledges");
const validate = require("./src/validate");
const clean = require("./src/clean");
const version = require("./src/version");
const main = require("./src/main");

module.exports = async ({ params, tokens, signFn, publishEventFn }) => {
  const { context } = await deps.authorizeCommand({
    requirements: {
      priviledges,
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    },
    tokens,
    strict: false
  });
  await deps.cleanCommand(params);
  await clean(params.payload);
  await deps.validateCommand(params);
  await validate(params.payload);
  await deps.normalizeCommand(params);
  const { payload, response } = await main({ params, context, signFn });
  const event = await deps.createEvent({
    payload,
    version,
    traceId: params.traceId,
    context,
    command: {
      id: params.id,
      issuedTimestamp: params.issuedTimestamp,
      action: process.env.ACTION,
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }
  });
  await publishEventFn(event);
  return response;
};
