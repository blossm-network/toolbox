import { create } from "@blossm/postgres-event-store-storage";
import { preconditionFailed, badRequest } from "@blossm/errors";

export default {
  db: { create },
  badRequestError: badRequest,
  preconditionFailedError: preconditionFailed,
};
