import createPublication from "@blossm/event-store-create-publication";
import { create } from "@blossm/mongodb-database";
import { preconditionFailed, badRequest, internalServer } from "@blossm/errors";
import hash from "@blossm/hash";

export default {
  createPublication,
  db: { create },
  hash,
  internalServerError: internalServer,
  badRequestError: badRequest,
  preconditionFailedError: preconditionFailed,
};
