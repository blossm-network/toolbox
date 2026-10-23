import deps from "../deps.js";

const identifier = (name) => `"${name.replace(/"/g, '""')}"`;
const number = "bigint NOT NULL CHECK (number BETWEEN 0 AND 9007199254740991)";

export default async ({ database, namespace = "public", indexes = [] }) => {
  const schema = identifier(namespace);
  const descriptors = Object.fromEntries(
    ["events", "snapshots", "counts", "blockchain"].map((kind) => [
      kind,
      { database, table: `${schema}.${identifier(kind)}`, kind },
    ])
  );
  const { events, snapshots, counts, blockchain } = descriptors;

  await deps.db.createTransaction({
    database,
    fn: async (transaction) => {
      const query = (text, values = []) =>
        deps.db.query({ database, transaction, text, values });

      // Serialize initializers, including CREATE SCHEMA/INDEX IF NOT EXISTS.
      await query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
        `blossm-event-store:${namespace}`,
      ]);
      await query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      await query(`CREATE TABLE IF NOT EXISTS ${events.table} (
        hash text PRIMARY KEY,
        nonce text NOT NULL UNIQUE,
        root text NOT NULL,
        number ${number},
        created timestamptz NOT NULL,
        idempotency text NOT NULL UNIQUE,
        doc jsonb NOT NULL,
        UNIQUE (root, number)
      )`);
      await query(`CREATE TABLE IF NOT EXISTS ${snapshots.table} (
        hash text PRIMARY KEY,
        nonce text NOT NULL UNIQUE,
        root text NOT NULL,
        number ${number},
        created timestamptz NOT NULL,
        doc jsonb NOT NULL,
        events bytea NOT NULL,
        UNIQUE (root, number)
      )`);
      await query(`CREATE TABLE IF NOT EXISTS ${counts.table} (
        root text PRIMARY KEY,
        value bigint NOT NULL CHECK (value BETWEEN 0 AND 9007199254740991),
        updated timestamptz NOT NULL
      )`);
      await query(`CREATE TABLE IF NOT EXISTS ${blockchain.table} (
        hash text PRIMARY KEY,
        number ${number} UNIQUE,
        created timestamptz NOT NULL,
        doc jsonb NOT NULL,
        events bytea NOT NULL,
        snapshots bytea NOT NULL,
        txs bytea NOT NULL
      )`);
      await query(
        `CREATE INDEX IF NOT EXISTS events_created_number ON ${events.table} (created, number)`
      );
      await query(
        `CREATE INDEX IF NOT EXISTS snapshots_root_created ON ${snapshots.table} (root, created DESC)`
      );
      await query(
        `CREATE INDEX IF NOT EXISTS counts_updated_root ON ${counts.table} (updated, root)`
      );
      await query(
        `CREATE INDEX IF NOT EXISTS counts_updated_reverse_root ON ${counts.table} (updated DESC, root)`
      );

      // One GIN index covers declared payload/state paths and array traversal.
      if (indexes.length)
        for (const store of [events, snapshots])
          await query(
            `CREATE INDEX IF NOT EXISTS ${store.kind}_document ON ${store.table} USING gin (doc jsonb_path_ops)`
          );
    },
  });

  return {
    eventStore: events,
    snapshotStore: snapshots,
    countsStore: counts,
    blockchainStore: blockchain,
  };
};
