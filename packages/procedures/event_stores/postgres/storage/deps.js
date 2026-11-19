import { query, stream, createTransaction } from "@blossm/postgres-database";

export default {
  db: { query, stream, createTransaction },
};
