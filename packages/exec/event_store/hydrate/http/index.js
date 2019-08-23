const authorize = require("./src/authorize");
const validate = require("./src/validate");

const deps = require("./deps");

module.exports = async ({ params, token }) => {
  await authorize(token);
  await validate(params);

  const store = deps.eventStore({
    domain: params.domain,
    service: params.service
  });

  return await store.hydrate(params.root);
};
