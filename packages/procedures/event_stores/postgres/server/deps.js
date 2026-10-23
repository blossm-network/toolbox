import { connect } from "@blossm/postgres-database";
import stores from "@blossm/postgres-event-store-storage";
import eventStore from "@blossm/event-store";
import count from "@blossm/postgres-event-store-count";
import createTransaction from "@blossm/postgres-event-store-create-transaction";
import eventStream from "@blossm/postgres-event-store-event-stream";
import findEvents from "@blossm/postgres-event-store-find-events";
import findOneSnapshot from "@blossm/postgres-event-store-find-one-snapshot";
import findSnapshots from "@blossm/postgres-event-store-find-snapshots";
import idempotencyConflictCheck from "@blossm/postgres-event-store-idempotency-conflict-check";
import latestBlock from "@blossm/postgres-event-store-latest-block";
import reserveRootCounts from "@blossm/postgres-event-store-reserve-root-counts";
import rootStream from "@blossm/postgres-event-store-root-stream";
import saveBlock from "@blossm/postgres-event-store-save-block";
import saveEvents from "@blossm/postgres-event-store-save-events";
import saveSnapshot from "@blossm/postgres-event-store-save-snapshot";

export default {
  db: { connect },
  stores,
  eventStore,
  count,
  createTransaction,
  eventStream,
  findEvents,
  findOneSnapshot,
  findSnapshots,
  idempotencyConflictCheck,
  latestBlock,
  reserveRootCounts,
  rootStream,
  saveBlock,
  saveEvents,
  saveSnapshot,
};
