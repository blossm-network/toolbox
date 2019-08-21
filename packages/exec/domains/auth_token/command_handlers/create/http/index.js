const deps = require("./deps");

const validate = require("./src/validate");
const clean = require("./src/clean");
const authorize = require("./src/authorize");
const version = require("./src/version");
const eventTopic = require("./src/event_topic");

module.exports = async ({ body, token, publishEventFn }) => {
  await authorize({ body, service: body.service, token });
  await deps.cleanCommand(body);
  await clean(body);
  await deps.validateCommand(body);
  await validate(body);
  await deps.normalizeCommand(body);
  const { payload, response } = await deps.main({ body });
  const event = await deps.createEvent(body, {
    version,
    topic: `${eventTopic.event}.${eventTopic.domain}.${body.service}`,
    service: body.service,
    payload
  });
  await publishEventFn(event);
  return response;
};
