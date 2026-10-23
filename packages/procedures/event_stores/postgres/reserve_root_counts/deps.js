import { query } from "@blossm/postgres-database";
import { string as dateString } from "@blossm/datetime";

export default {
  db: { query },
  dateString,
};
