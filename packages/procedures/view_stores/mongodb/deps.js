import {
  store,
  find,
  aggregate,
  count,
  write,
  remove,
} from "@blossm/mongodb-database";
import { string as dateString } from "@blossm/datetime";
import viewStore from "@blossm/view-store";
import formatSchema from "@blossm/format-mongodb-schema";
import uuid from "@blossm/uuid";
import uuidValidator from "@blossm/uuid-validator";

export default {
  dateString,
  viewStore,
  formatSchema,
  uuid,
  uuidValidator,
  db: { store, find, count, write, remove, aggregate },
};
