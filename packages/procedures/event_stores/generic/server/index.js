const deps = require("./deps");

module.exports = async ({
  findOneFn,
  writeFn,
  mapReduceFn,
  publishFn
} = {}) => {
  deps
    .server()
    .get(deps.get({ findOneFn }), { path: "/:root" })
    .post(deps.post({ writeFn, mapReduceFn, publishFn, findOneFn }))
    .listen();
};
