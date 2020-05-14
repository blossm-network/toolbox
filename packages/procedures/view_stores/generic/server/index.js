const deps = require("./deps");

module.exports = async ({
  streamFn,
  findFn,
  writeFn,
  removeFn,
  queryFn,
  putFn,
  one,
} = {}) => {
  deps
    .server()
    .get(deps.stream({ streamFn, ...(queryFn && { queryFn }) }), {
      path: "/stream/:root?",
    })
    .get(
      deps.get({ findFn, ...(queryFn && { queryFn }), ...(one && { one }) }),
      {
        path: "/:root?",
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
