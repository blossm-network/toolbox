import { create } from "@blossm/mongodb-database";
import { preconditionFailed, badRequest, internalServer } from "@blossm/errors";
import hash from "@blossm/hash";

export default {
  db: { create },
  hash,
  internalServerError: internalServer,
  badRequestError: badRequest,
  preconditionFailedError: preconditionFailed,
};
