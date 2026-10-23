import assert from "node:assert/strict";
import mongoose from "mongoose";
import server from "../index.js";
import deps from "../deps.js";

const uri = process.env.BLOSSM_TEST_MONGODB_URI;
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\//.test(uri || ""))
  throw new Error(
    "Set BLOSSM_TEST_MONGODB_URI to an isolated localhost replica set."
  );
const database = `blossm_startup_${process.pid}_${Date.now()}`;
Object.assign(process.env, {
  NODE_ENV: "audit",
  DOMAIN: "audit",
  SERVICE: "events",
  NETWORK: "local",
});
for (const key of [
  "MONGODB_PROTOCOL",
  "MONGODB_USER",
  "MONGODB_HOST",
  "MONGODB_DATABASE",
])
  delete process.env[key];
await mongoose.connect(uri, {
  dbName: database,
  serverSelectionTimeoutMS: 5000,
});
const eventStore = deps.eventStore;
try {
  let composition;
  deps.eventStore = (options) => {
    composition = options;
  };
  await server({
    schema: { amount: Number },
    handlers: { set() {} },
    secretFn: async () => undefined,
  });
  await Promise.all(
    mongoose.modelNames().map((name) => mongoose.model(name).init())
  );
  assert.equal(typeof composition.saveEventsFn, "function");
  for (const [collection, field] of [
    ["events", "hash"],
    ["events", "headers.idempotency"],
    ["snapshots", "hash"],
    ["counts", "root"],
    ["blockchain", "headers.number"],
  ]) {
    const indexes = await mongoose.connection.collection(collection).indexes();
    const matches = indexes.filter(
      ({ key }) => Object.keys(key).length === 1 && key[field] === 1
    );
    assert.equal(matches.length, 1);
    assert.equal(matches[0].unique, true);
  }
  console.log("real MongoDB server startup and five unique indexes passed");
} finally {
  deps.eventStore = eventStore;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
