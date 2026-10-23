import aggregate from "@blossm/event-store-aggregate";
import { badRequest } from "@blossm/errors";

export default {
  aggregate,
  badRequestError: badRequest,
};
