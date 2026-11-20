import eventStore from "@blossm/postgres-event-store";
import handlers from "./handlers.js";

import config from "./config.json" with { type: "json" };

// Cloud clients are loaded only outside local mode.
const {
  publishFn,
  signFn,
  encryptFn,
  createBlockFn,
  blockPublisherPublicKeyFn,
} = await import(
  process.env.NODE_ENV == "local" ? "./local.js" : "./cloud.js"
);

// The deployment supplies the whole connection. Refuse to start rather than
// let the driver fall back to its own defaults.
const required = [
  "PG_HOST",
  "PG_DATABASE",
  "PG_USER",
  "PG_PASSWORD",
  "PG_MAX",
  "PG_NAMESPACE",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length)
  throw new Error(`Missing PostgreSQL configuration: ${missing.join(", ")}`);

export default await eventStore({
  connection: {
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    max: Number(process.env.PG_MAX),
  },
  namespace: process.env.PG_NAMESPACE,
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  publishFn,
  signFn,
  encryptFn,
  createBlockFn,
  blockPublisherPublicKeyFn,
  isPublic: config.isPublic || false,
});
