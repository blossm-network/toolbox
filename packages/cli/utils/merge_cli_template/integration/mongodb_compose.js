import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import databaseDeps from "@blossm/mongodb-database/deps.js";
import databaseName from "../src/write_compose/database_name.js";
import databaseService from "../src/write_compose/database_service.js";

const { MongoClient } = databaseDeps.mongoose.mongo;
const suite = process.env.TEST_MONGOD ? describe : describe.skip;
const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const script = new URL("../template/mongodb-init.sh", import.meta.url);

suite("Generated Compose Mongo bootstrap with native Mongo", function () {
  this.timeout(60000);
  let directory, port, daemon, env, uri;
  const databases = [
    { procedure: "view-store", context: "team", name: "summary" },
    { procedure: "view-store", context: "other", name: "summary" },
    { procedure: "event-store", service: "core", domain: "ledger" },
  ].map(databaseName);
  const stop = async () => {
    if (!daemon || daemon.exitCode !== null) return;
    const exited = new Promise((resolve) => daemon.once("exit", resolve));
    daemon.kill("SIGTERM");
    await exited;
  };
  const start = async (authenticate = false) => {
    const args = [
      "--dbpath",
      path.join(directory, "data"),
      "--port",
      `${port}`,
      "--bind_ip",
      "127.0.0.1",
      "--replSet",
      env.MONGODB_REPLICA_SET,
      "--logpath",
      path.join(directory, "mongod.log"),
      "--logappend",
    ];
    if (authenticate)
      args.push("--auth", "--keyFile", path.join(directory, "keyfile"));
    daemon = spawn(process.env.TEST_MONGOD, args, { stdio: "ignore" });
    let lastError;
    for (let attempt = 0; attempt < 60; attempt++) {
      const client = new MongoClient(uri, {
        directConnection: true,
        serverSelectionTimeoutMS: 100,
      });
      try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        return;
      } catch (error) {
        lastError = error;
      } finally {
        await client.close();
      }
      if (daemon.exitCode !== null)
        throw new Error(
          readFileSync(path.join(directory, "mongod.log"), "utf8")
        );
      await wait(100);
    }
    throw lastError;
  };
  const ready = () =>
    spawnSync("bash", [script.pathname, "ready"], {
      env,
      encoding: "utf8",
      timeout: 10000,
    });

  before(async () => {
    directory = mkdtempSync(path.join(tmpdir(), "blossm-compose-mongo-"));
    mkdirSync(path.join(directory, "data"));
    writeFileSync(
      path.join(directory, "keyfile"),
      randomBytes(48).toString("base64"),
      { mode: 0o600 }
    );
    const listener = net.createServer();
    await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
    port = listener.address().port;
    await new Promise((resolve) => listener.close(resolve));
    const service = databaseService({
      databases,
      adminDatabase: "admin",
      user: "tester",
      userPassword: "fixture-password",
    });
    env = {
      ...process.env,
      ...service.environment,
      TMPDIR: directory,
      MONGODB_REPLICA_HOST: `127.0.0.1:${port}`,
    };
    uri = `mongodb://127.0.0.1:${port}`;
    await start();
  });
  after(async () => {
    await stop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it("does not initialize the temporary entrypoint daemon and becomes ready only after election", async () => {
    writeFileSync(
      path.join(directory, "docker-entrypoint-temp-mongod.pid"),
      `${daemon.pid}`
    );
    assert.equal(ready().status, 1);
    const bootstrapProbe = spawnSync(
      "mongosh",
      [
        "--norc",
        "--host",
        "127.0.0.1",
        "--port",
        `${port}`,
        "admin",
        "--quiet",
        "--eval",
        "quit(0)",
      ],
      { encoding: "utf8", timeout: 10000 }
    );
    assert.equal(
      bootstrapProbe.status,
      0,
      `the official entrypoint probe must work before replica-set initialization: ${bootstrapProbe.stderr}`
    );
    const client = await new MongoClient(uri, {
      directConnection: true,
    }).connect();
    try {
      await assert.rejects(
        client.db("admin").command({ replSetGetStatus: 1 }),
        { code: 94 }
      );
    } finally {
      await client.close();
    }
    rmSync(path.join(directory, "docker-entrypoint-temp-mongod.pid"));
    let result;
    for (let attempt = 0; attempt < 20; attempt++) {
      result = ready();
      if (result.status === 0) break;
      await wait(100);
    }
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(ready().status, 0, "readiness is repeatable");
    const admin = await new MongoClient(uri).connect();
    try {
      const {
        users: [user],
      } = await admin.db("admin").command({ usersInfo: env.MONGODB_USER });
      assert.deepEqual(
        user.roles.map(({ db, role }) => `${db}:${role}`).sort(),
        databases.flatMap((db) => [`${db}:readWrite`, `${db}:dbAdmin`]).sort()
      );
    } finally {
      await admin.close();
    }
  });

  it("isolates view bodies, fences and receipts and enforces exact authenticated database grants", async () => {
    await stop();
    await start(true);
    const client = await new MongoClient(
      `mongodb://${env.MONGODB_USER}:${env.MONGODB_USER_PASSWORD}@127.0.0.1:${port}/?authSource=admin&replicaSet=${env.MONGODB_REPLICA_SET}`
    ).connect();
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        for (const dbName of databases) {
          const db = client.db(dbName);
          await db
            .collection("views")
            .insertOne({ _id: "same-view", body: dbName }, { session });
          await db
            .collection("projection_control")
            .insertOne({ _id: "destination", owner: dbName }, { session });
          await db
            .collection("projection_receipts")
            .insertOne({ _id: "same-play", result: dbName }, { session });
        }
      });
      for (const dbName of databases) {
        const db = client.db(dbName);
        assert.equal(
          (await db.collection("views").findOne({ _id: "same-view" })).body,
          dbName
        );
        assert.equal(
          (
            await db
              .collection("projection_control")
              .findOne({ _id: "destination" })
          ).owner,
          dbName
        );
        assert.equal(
          (
            await db
              .collection("projection_receipts")
              .findOne({ _id: "same-play" })
          ).result,
          dbName
        );
      }
      await assert.rejects(
        client
          .db("not_a_fixture")
          .collection("views")
          .insertOne({ secret: true }),
        { code: 13 }
      );
    } finally {
      await session.endSession();
      await client.close();
    }
  });
});
