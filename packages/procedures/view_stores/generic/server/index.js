const deps = require("./deps");

module.exports = async ({
  streamFn,
  findFn,
  findOneFn,
  writeFn,
  removeFn,
  getFn,
  postFn,
  putFn
} = {}) => {
  deps
    .server()
    .get(deps.stream({ streamFn, ...(getFn && { fn: getFn }) }), {
      path: "/stream"
    })
    .get(deps.get({ findFn, findOneFn, ...(getFn && { fn: getFn }) }))
    .post(deps.post({ writeFn, ...(postFn && { fn: postFn }) }))
    .put(deps.put({ writeFn, ...(putFn && { fn: putFn }) }))
    .delete(deps.delete({ removeFn }))
    .listen();
};
