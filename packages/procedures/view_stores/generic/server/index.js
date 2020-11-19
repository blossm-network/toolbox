const deps = require("./deps");

const defaultFormatFn = (content) => content;

module.exports = async ({
  streamFn,
  findFn,
  writeFn,
  removeFn,
  queryFn,
  sortFn,
  updateFn,
  formatFn = defaultFormatFn,
  formatCsvFn,
  emptyFn,
  countFn,
  groupsLookupFn,
  one,
  group,
  updateKeys,
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
        groupsLookupFn,
        ...(queryFn && { queryFn }),
        ...(formatCsvFn && { formatCsvFn }),
        ...(sortFn && { sortFn }),
        ...(formatFn && { formatFn }),
        ...(emptyFn && { emptyFn }),
        ...(one && { one }),
        ...(group && { group }),
        ...(updateKeys && { updateKeys }),
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
          ...(updateKeys && { updateKeys }),
        },
        {
          path: "/:id",
        }
      )
    )
    .delete(
      deps.delete(
        { removeFn, groupsLookupFn, ...(group && { group }) },
        {
          path: "/:id?",
        }
      )
    )
    .listen();
};
