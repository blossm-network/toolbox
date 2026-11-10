import { badRequest, resourceNotFound } from "@blossm/errors";
import query from "@blossm/event-store-query";
import aggregate from "@blossm/event-store-aggregate";

export default {
  resourceNotFoundError: resourceNotFound,
  badRequestError: badRequest,
  query,
  aggregate,
};
