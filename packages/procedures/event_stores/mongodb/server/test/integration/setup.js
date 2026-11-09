import mongoose from "mongoose";
import { restore } from "sinon";
import { __resetStoresForTest } from "../../index.js";

// Register inside each suite so database and module state cannot leak between suites.
export default () => {
  let environment;
  let connected = false;

  before(async () => {
    const uri = process.env.BLOSSM_TEST_MONGODB_URI;
    if (
      !/^mongodb:\/\/127\.0\.0\.1:\d+\/\?replicaSet=[A-Za-z0-9_-]+$/.test(
        uri || ""
      )
    )
      throw new Error(
        "Set BLOSSM_TEST_MONGODB_URI to a disposable localhost replica set."
      );
    environment = { ...process.env };
    Object.assign(process.env, {
      NODE_ENV: "test",
      DOMAIN: "test",
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
    __resetStoresForTest();
    await mongoose.connect(uri, {
      dbName: `blossm_test_${process.pid}_${Date.now()}`,
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
  });

  after(async () => {
    try {
      if (connected) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
      mongoose.deleteModel(/.*/);
      __resetStoresForTest();
      restore();
      if (environment) {
        for (const key of Object.keys(process.env))
          if (!(key in environment)) delete process.env[key];
        Object.assign(process.env, environment);
      }
    }
  });
};
