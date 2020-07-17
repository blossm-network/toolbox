const deps = require("./deps");

module.exports = async ({
  // streamFn,
  findFn,
  writeFn,
  removeFn,
  queryFn,
  updateFn,
  countFn,
  one,
} = {}) => {
  deps
    .server()
    // .get(deps.stream({ streamFn, ...(queryFn && { queryFn }) }), {
    //   path:
    //     "/stream/:sourceNetwork?/:sourceService?/:sourceDomain?/:sourceRoot?",
    // })
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
    .post(deps.post({ writeFn, ...(updateFn && { updateFn }) }))
    .delete(deps.delete({ removeFn }))
    .listen();
};
