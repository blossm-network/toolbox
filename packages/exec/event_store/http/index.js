const authorize = require("./src/authorize");
const cleanAdd = require("./src/clean_add");
const validateAdd = require("./src/validate_add");
const validateHydrate = require("./src/validate_hydrate");

const deps = require("./deps");

exports.add = async ({ body, token }) => {
  await authorize(token);
  await cleanAdd(body);
  await validateAdd(body);

  const store = deps.eventStore({ storeId: body.storeId });
  store.add({ event: body.event });
};

exports.hydrate = async ({ body, token }) => {
  await authorize(token);
  await validateHydrate(body);

  const store = deps.eventStore({ storeId: body.storeId });
  const aggregateRoot = store.hydrate({ root: body.root });
  return aggregateRoot;
};
