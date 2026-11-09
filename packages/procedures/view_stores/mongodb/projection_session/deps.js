import { write as viewWrite, formatView } from "@blossm/view-store-put";
import { remove as viewRemove } from "@blossm/view-store-delete";
import { queryForIds } from "@blossm/view-store-id-stream";
import uuid from "@blossm/uuid";
import { badRequest, conflict } from "@blossm/errors";

export default {
  viewWrite,
  formatView,
  viewRemove,
  queryForIds,
  uuid,
  badRequestError: badRequest,
  conflictError: conflict,
};
