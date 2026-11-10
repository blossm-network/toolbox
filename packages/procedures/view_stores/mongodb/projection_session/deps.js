import {
  write as viewWrite,
  remove as viewRemove,
  formatView,
} from "@blossm/view-store-mutations";
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
