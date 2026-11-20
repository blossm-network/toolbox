import deps from "./deps.js";

export default ({ countsStore: { database, table } }) =>
  async ({ root, amount, transaction }) => {
    const {
      rows: [count],
    } = await deps.db.query({
      database,
      text: `INSERT INTO ${table} AS counts (root, value, updated)
      VALUES ($1, $2, $3)
      ON CONFLICT (root) DO UPDATE
      SET value = counts.value + EXCLUDED.value, updated = EXCLUDED.updated
      RETURNING root, value, updated`,
      values: [root, amount, deps.dateString()],
      transaction,
    });

    return { ...count, value: Number(count.value) };
  };
