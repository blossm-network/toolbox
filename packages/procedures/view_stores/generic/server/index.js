import deps from "./deps.js";

const defaultFormatFn = (content) => content;

export default async ({
  streamFn,
  findFn,
  writeFn,
  removeFn,
  queryFn,
  sortFn,
  updateFn,
  formatFn = defaultFormatFn,
  formatCsv,
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
        ...(formatCsv && { formatCsv }),
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
      deps.del(
        { removeFn, groupsLookupFn, ...(group && { group }) },
        {
          path: "/:id?",
        }
      )
    )
    .listen();
};
