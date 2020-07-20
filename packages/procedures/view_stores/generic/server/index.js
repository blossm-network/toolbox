const deps = require("./deps");

const defaultFormatFn = (content) => content;

module.exports = async ({
  // streamFn,
  findFn,
  writeFn,
  removeFn,
  queryFn,
  updateFn,
  formatFn = defaultFormatFn,
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
        ...(formatFn && { formatFn }),
        ...(one && { one }),
      }),
      {
        path: "/:sourceNetwork?/:sourceService?/:sourceDomain?/:sourceRoot?",
      }
    )
    .post(
      deps.post({
        writeFn,
        ...(updateFn && { updateFn }),
        ...(formatFn && { formatFn }),
      })
    )
    .delete(deps.delete({ removeFn }))
    .listen();
};
