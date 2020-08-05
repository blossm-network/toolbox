const deps = require("./deps");

const defaultFormatFn = (content) => content;

module.exports = async ({
  streamFn,
  findFn,
  writeFn,
  removeFn,
  queryFn,
  updateFn,
  formatFn = defaultFormatFn,
  emptyFn,
  countFn,
  one,
} = {}) => {
  deps
    .server()
    .get(deps.idStream({ streamFn, ...(queryFn && { queryFn }) }), {
      path: "/stream-ids",
    })
    .get(
      deps.get({
        findFn,
        countFn,
        ...(queryFn && { queryFn }),
        ...(formatFn && { formatFn }),
        ...(emptyFn && { emptyFn }),
        ...(one && { one }),
      }),
      {
        path: "/:id?",
      }
    )
    .put(
      deps.put(
        {
          writeFn,
          ...(updateFn && { updateFn }),
          ...(formatFn && { formatFn }),
        },
        {
          path: "/:id",
        }
      )
    )
    .delete(deps.delete({ removeFn }))
    .listen();
};
