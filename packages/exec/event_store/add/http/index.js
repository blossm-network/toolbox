const authorize = require("./src/authorize");
const clean = require("./src/clean");
const validate = require("./src/validate");

const deps = require("./deps");

module.exports = async ({ params, tokens }) => {
  await authorize(tokens);
  await clean(params);
  await validate(params);

  const store = deps.eventStore({
    domain: params.domain,
    service: params.service
  });

  await store.add(params.event);
  await deps.eventBus.publish(params.event);
};
