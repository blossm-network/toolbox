const deps = require("./deps");

const priviledges = require("./src/priviledges");
const validate = require("./src/validate");
const clean = require("./src/clean");
const version = require("./src/version");

module.exports = async ({ params, tokens, publishEventFn }) => {
  const { context } = await deps.authorizeCommand({
    priviledges,
    tokens,
    strict: false
  });
  await deps.cleanCommand(params);
  await clean(params);
  await deps.validateCommand(params);
  await validate(params);
  await deps.normalizeCommand(params);
  const { payload, response } = await deps.main({ params, context });
  const event = await deps.createEvent({
    payload,
    version,
    traceId: params.traceId,
    context,
    command: {
      id: params.id,
      issuedTimestamp: params.issuedTimestamp
    }
  });
  await publishEventFn(event);
  return response;
};
