import { create } from "@blossm/mongodb-database";
import { preconditionFailed, badRequest } from "@blossm/errors";

export default {
  db: { create },
  badRequestError: badRequest,
  preconditionFailedError: preconditionFailed,
};
