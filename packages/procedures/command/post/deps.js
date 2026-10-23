import { QUEUED as DELIVERY_QUEUED } from "@blossm/rpc-delivery-consts";
import { QUEUED, UNKNOWN } from "@blossm/event-outcome-consts";
import createEvent from "@blossm/create-event";
import eventStore from "@blossm/event-store-rpc";
import { string as dateString } from "@blossm/datetime";
import uuid from "@blossm/uuid";
import { forbidden, badRequest } from "@blossm/errors";

export default {
  DELIVERY_QUEUED,
  QUEUED,
  UNKNOWN,

  createEvent,
  eventStore,
  dateString,
  uuid,
  forbiddenError: forbidden,
  badRequestError: badRequest,
};
