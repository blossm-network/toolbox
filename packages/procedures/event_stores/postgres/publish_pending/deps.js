import deliverPending from "@blossm/event-store-deliver-pending";
import {
  findPublications,
  removePublication,
  incrementPublicationAttempts,
} from "@blossm/postgres-event-store-storage";

export default {
  deliverPending,
  db: {
    find: findPublications,
    remove: removePublication,
    write: incrementPublicationAttempts,
  },
};
