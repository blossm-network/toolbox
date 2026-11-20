import eventStore from "@blossm/mongodb-event-store";
import gcpSecret from "@blossm/gcp-secret";
import handlers from "./handlers.js";
import {
  publishFn,
  signFn,
  encryptFn,
  createBlockFn,
  blockPublisherPublicKeyFn,
} from "./cloud.js";

import config from "./config.json" with { type: "json" };

export default eventStore({
  schema: config.schema,
  indexes: config.indexes,
  handlers,
  secretFn: gcpSecret.get,
  publishFn,
  signFn,
  encryptFn,
  createBlockFn,
  blockPublisherPublicKeyFn,
  isPublic: config.isPublic || false,
});
