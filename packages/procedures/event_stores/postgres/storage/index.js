import deps from "./deps.js";
import buildQuery from "./src/query.js";
import { columns, encode, decode } from "./src/document.js";
import stores from "./src/stores.js";

export { stores };
export default stores;

export const find = async ({
  store,
  query,
  sort,
  select,
  limit = 100,
  transaction,
}) => {
  const result = await deps.db.query({
    database: store.database,
    ...buildQuery({ store, query, sort, select, limit }),
    transaction,
  });
  return result.rows.map((row) => decode({ kind: store.kind, row, select }));
};

export const stream = ({
  store,
  query,
  sort,
  limit,
  parallel = 1,
  fn,
  transaction,
}) =>
  deps.db.stream({
    database: store.database,
    ...buildQuery({ store, query, sort, limit }),
    transaction,
    parallel,
    fn: (row) => fn(decode({ kind: store.kind, row })),
  });

export const create = async ({ store, data, transaction }) => {
  if (!data.length) return [];

  // ponytail: one atomic insert, chunk inside a transaction above 9,362 events.
  const names = columns(store.kind);
  const values = data.flatMap((document) =>
    encode({ kind: store.kind, document })
  );
  const tuples = data.map(
    (_, index) =>
      `(${names
        .map((_, column) => `$${index * names.length + column + 1}`)
        .join(", ")})`
  );
  const result = await deps.db.query({
    database: store.database,
    text: `INSERT INTO ${store.table} (${names.join(
      ", "
    )}) VALUES ${tuples.join(", ")} RETURNING *`,
    values,
    transaction,
  });
  return result.rows.map((row) => decode({ kind: store.kind, row }));
};

export const save = async ({ store, data, transaction }) => {
  const names = columns(store.kind);
  const result = await deps.db.query({
    database: store.database,
    text: `INSERT INTO ${store.table} (${names.join(", ")}) VALUES (${names
      .map((_, index) => `$${index + 1}`)
      .join(", ")})
      ON CONFLICT (hash) DO UPDATE SET ${names
        .filter((name) => name != "hash")
        .map((name) => `${name} = EXCLUDED.${name}`)
        .join(", ")}
      RETURNING *`,
    values: encode({ kind: store.kind, document: data }),
    transaction,
  });
  return decode({ kind: store.kind, row: result.rows[0] });
};
