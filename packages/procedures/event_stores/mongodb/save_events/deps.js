import createPublication from "@blossm/event-store-create-publication";
import { create } from "@blossm/mongodb-database";
import { preconditionFailed, badRequest, internalServer } from "@blossm/errors";

export default {
  createPublication,
  db: { create },
  internalServerError: internalServer,
  badRequestError: badRequest,
  preconditionFailedError: preconditionFailed,
};
