import { find } from "@blossm/mongodb-database";
import aggregate from "@blossm/event-store-aggregate";
import { badRequest } from "@blossm/errors";

export default {
  db: { find },
  aggregate,
  badRequestError: badRequest,
};
