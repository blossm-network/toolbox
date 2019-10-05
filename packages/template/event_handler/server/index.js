const deps = require("./deps");

module.exports = async ({ mainFn } = {}) => {
  deps
    .server()
    .post(
      deps.post({
        mainFn
      })
    )
    .listen();
};
