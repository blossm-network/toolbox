const authorize = require("./src/authorize");
const cleanAdd = require("./src/clean_add");
const validateAdd = require("./src/validate_add");
const validateHydrate = require("./src/validate_hydrate");

const deps = require("./deps");

exports.add = async ({ body, tokens }) => {
  await authorize(tokens);
  await cleanAdd(body);
  await validateAdd(body);

  const store = deps.eventStore({
    domain: body.domain,
    service: body.service
  });

  await store.add({ event: body.event });
};

exports.hydrate = async ({ query, token }) => {
  await authorize(token);
  await validateHydrate(query);

  const store = deps.eventStore({
    domain: query.domain,
    service: query.service
  });

  return await store.hydrate({ root: query.root });
};
