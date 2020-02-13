const deps = require("./deps");

module.exports = async ({
  streamFn,
  findFn,
  findOneFn,
  writeFn,
  removeFn,
  queryFn,
  dataFn
} = {}) => {
  deps
    .server()
    .get(deps.stream({ streamFn, ...(queryFn && { queryFn }) }), {
      path: "/stream"
    })
    .get(deps.get({ findFn, findOneFn, ...(queryFn && { queryFn }) }))
    .post(deps.post({ writeFn, ...(dataFn && { dataFn }) }))
    .put(deps.put({ writeFn, ...(dataFn && { dataFn }) }))
    .delete(deps.delete({ removeFn }))
    .listen();
};
