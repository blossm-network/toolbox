const deps = require("./deps");

module.exports = async ({ mainFn, viewsFn } = {}) =>
  deps.server().get(deps.get({ mainFn, viewsFn })).listen();
