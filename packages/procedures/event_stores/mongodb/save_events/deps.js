import { create } from "@blossm/mongodb-database";
import { preconditionFailed, badRequest, internalServer } from "@blossm/errors";

export default {
  db: { create },
  internalServerError: internalServer,
  badRequestError: badRequest,
  preconditionFailedError: preconditionFailed,
};
