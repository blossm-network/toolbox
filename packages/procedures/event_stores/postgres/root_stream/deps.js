import {
  stream,
  streamPendingRoots,
} from "@blossm/postgres-event-store-storage";

export default {
  db: { stream, streamPendingRoots },
};
