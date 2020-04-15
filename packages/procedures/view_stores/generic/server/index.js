const deps = require("./deps");

module.exports = async ({
  streamFn,
  findFn,
  // findOneFn,
  writeFn,
  removeFn,
  queryFn,
  // postFn,
  putFn
} = {}) => {
  deps
    .server()
    .get(deps.stream({ streamFn, ...(queryFn && { queryFn }) }), {
      path: "/stream"
    })
    .get(deps.get({ findFn, /* findOneFn, */ ...(queryFn && { queryFn }) }), {
      path: "/:root?"
    })
    // .post(deps.post({ writeFn, ...(postFn && { dataFn: postFn }) }))
    .put(deps.put({ writeFn, ...(putFn && { dataFn: putFn }) }), {
      path: "/:root"
    })
    .delete(deps.delete({ removeFn }), {
      path: "/:root"
    })
    .listen();
};
