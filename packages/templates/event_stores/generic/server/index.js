const deps = require("./deps");

module.exports = async ({ findOneFn, writeFn, mapReduceFn } = {}) => {
  deps
    .server()
    .get(deps.get({ findOneFn }), { path: "/:root" })
    .post(deps.post({ writeFn, mapReduceFn }))
    .listen();
};
