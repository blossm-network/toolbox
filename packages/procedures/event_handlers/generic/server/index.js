const deps = require("./deps");

module.exports = async ({ mainFn, streamFn } = {}) => {
  deps.server().post(deps.post({ mainFn, streamFn })).listen();
};
