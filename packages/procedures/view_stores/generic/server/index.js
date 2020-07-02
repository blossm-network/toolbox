const deps = require("./deps");

module.exports = async ({
  streamFn,
  findFn,
  writeFn,
  removeFn,
  queryFn,
  putFn,
  countFn,
  one,
} = {}) => {
  deps
    .server()
    .get(deps.stream({ streamFn, ...(queryFn && { queryFn }) }), {
      path:
        "/stream/:sourceNetwork?/:sourceService?/:sourceDomain?/:sourceRoot?",
    })
    .get(
      deps.get({
        findFn,
        countFn,
        ...(queryFn && { queryFn }),
        ...(one && { one }),
      }),
      {
        path: "/:sourceNetwork?/:sourceService?/:sourceDomain?/:sourceRoot?",
      }
    )
    .put(deps.put({ writeFn, ...(putFn && { viewFn: putFn }) }), {
      path: "/:root",
    })
    .delete(deps.delete({ removeFn }), {
      path: "/:root",
    })
    .listen();
};
