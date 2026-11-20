import { AsyncLocalStorage } from "node:async_hooks";
import deps from "./deps.js";

const transactions = new AsyncLocalStorage();
let cursorCount = 0;

const connect = (connection) => {
  const database = new deps.Pool(connection);
  database.on("error", (err) =>
    deps.logger.error("Database has errored.", { err }),
  );
  return database;
};

const query = ({ database, text, values = [], transaction }) =>
  (transaction || transactions.getStore()?.get(database) || database).query(
    text,
    values,
  );

const runTransaction = async ({ database, fn, attempts }) => {
  const current = transactions.getStore()?.get(database);
  if (current) return fn(current);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const transaction = await database.connect();
    // pg-pool removes its error listener at checkout. An unhandled client
    // "error" event would crash the process; its queries already reject.
    const ignore = () => {};
    transaction.on("error", ignore);
    let committing = false;
    let discard = false;

    try {
      await transaction.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
      const context = new Map(transactions.getStore());
      context.set(database, transaction);
      const result = await transactions.run(context, () => fn(transaction));
      committing = true;
      const { command } = await transaction.query("COMMIT");
      // PostgreSQL answers COMMIT of an aborted transaction with ROLLBACK.
      if (command === "ROLLBACK")
        throw new Error("Transaction was aborted; COMMIT rolled it back.");
      return result;
    } catch (error) {
      discard = committing;
      try {
        await transaction.query("ROLLBACK");
      } catch {
        discard = true;
      }
      if (
        discard ||
        attempt === attempts ||
        !["40001", "40P01"].includes(error.code)
      )
        throw error;
    } finally {
      transaction.removeListener("error", ignore);
      transaction.release(discard);
    }
    await deps.sleep(10 * 2 ** (attempt - 1) + Math.random() * 20);
  }
};

const createTransaction = ({ database, fn }) =>
  runTransaction({ database, fn, attempts: 5 });

const stream = async ({
  database,
  text,
  values = [],
  transaction,
  parallel = 1,
  limit = Infinity,
  fn,
}) => {
  parallel = Math.max(1, Number(parallel) || 1);
  const read = async (client) => {
    const cursor = `blossm_cursor_${++cursorCount}`;
    await client.query(
      `DECLARE ${cursor} NO SCROLL CURSOR FOR ${text}`,
      values,
    );
    let remaining = limit;
    let failure;

    try {
      while (remaining > 0) {
        const { rows } = await client.query(
          `FETCH FORWARD ${Math.min(100, remaining)} FROM ${cursor}`,
        );
        if (!rows.length) break;
        remaining -= rows.length;
        for (let i = 0; i < rows.length; i += parallel) {
          const results = await Promise.allSettled(
            rows.slice(i, i + parallel).map(async (row) => fn(row)),
          );
          const rejected = results.find(({ status }) => status === "rejected");
          if (rejected) throw rejected.reason;
        }
      }
    } catch (error) {
      failure = { error };
    }
    // Always close; a close failure never replaces the original failure.
    try {
      await client.query(`CLOSE ${cursor}`);
    } catch (error) {
      failure ??= { error };
    }
    if (failure) throw failure.error;
  };

  const current = transaction || transactions.getStore()?.get(database);
  if (current) {
    const context = new Map(transactions.getStore());
    context.set(database, current);
    return transactions.run(context, () => read(current));
  }
  // Callbacks may have side effects, so an owned stream is never replayed.
  return runTransaction({ database, fn: read, attempts: 1 });
};

export { connect, query, createTransaction, stream };
