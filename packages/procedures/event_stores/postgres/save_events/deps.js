import { create } from "@blossm/postgres-event-store-storage";
import createPublication from "@blossm/event-store-create-publication";
import { preconditionFailed, badRequest, internalServer } from "@blossm/errors";

export default {
  db: { create },
  createPublication,
  internalServerError: internalServer,
  badRequestError: badRequest,
  preconditionFailedError: preconditionFailed,
};
