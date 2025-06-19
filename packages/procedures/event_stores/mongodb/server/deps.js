import { store } from "@blossm/mongodb-database";
import { string as dateString } from "@blossm/datetime";
import eventStore from "@blossm/event-store";
import saveEvents from "@blossm/mongodb-event-store-save-events";
import eventStream from "@blossm/mongodb-event-store-event-stream";
import findEvents from "@blossm/mongodb-event-store-find-events";
import findOneSnapshot from "@blossm/mongodb-event-store-find-one-snapshot";
import findSnapshots from "@blossm/mongodb-event-store-find-snapshots";
import reserveRootCounts from "@blossm/mongodb-event-store-reserve-root-counts";
import query from "@blossm/mongodb-event-store-query";
import rootStream from "@blossm/mongodb-event-store-root-stream";
import count from "@blossm/mongodb-event-store-count";
import createTransaction from "@blossm/mongodb-event-store-create-transaction";
import saveSnapshot from "@blossm/mongodb-event-store-save-snapshot";
import saveBlock from "@blossm/mongodb-event-store-save-block";
import latestBlock from "@blossm/mongodb-event-store-latest-block";
import formatSchema from "@blossm/format-mongodb-schema";
import idempotencyConflictCheck from "@blossm/mongodb-event-store-idempotency-conflict-check";
import uuid from "@blossm/uuid";

export default {
  dateString,
  eventStore,
  db: { store },
  saveEvents,
  saveSnapshot,
  reserveRootCounts,
  query,
  rootStream,
  createTransaction,
  idempotencyConflictCheck,
  count,
  formatSchema,
  uuid,
  saveBlock,
  latestBlock,
  eventStream,
  findEvents,
  findOneSnapshot,
  findSnapshots,
};
