const deps = require("./deps");
const config = require("./config");

const validate = require("./src/validate");
const clean = require("./src/clean");
const authorize = require("./src/authorize");
const version = require("./src/version");

module.exports = async ({ params, tokens, publishEventFn }) => {
  await authorize({ params, tokens });
  await deps.cleanCommand(params);
  await clean(params);
  await deps.validateCommand(params);
  await validate(params);
  await deps.normalizeCommand(params);
  const { payload, response } = await deps.main(params);
  const event = await deps.createEvent(params, {
    ...config,
    version,
    payload
  });
  await publishEventFn(event);
  return response;
};
