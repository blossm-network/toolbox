import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import yaml from "yaml";
import { connect } from "@blossm/postgres-database";
import { cliDir } from "../load.js";
import { deploy, profile, procedure } from "../postgres_deploy_fixture.js";

// Starts the entrypoint the real deploy command renders, with the generated
// local Compose environment, against a native PostgreSQL database, and drives
// it over loopback HTTP. The service's declared dependencies are linked to
// this workspace's real packages: nothing is installed, built into an image,
// submitted or deployed, and the only `gcloud` on any PATH is a recording
// double. This is not evidence of npm publication, the container image, Cloud
// SQL connectivity or IAM.
if (!process.env.TEST_POSTGRES_URL)
  throw new Error(
    "Set TEST_POSTGRES_URL to a disposable PostgreSQL test database.",
  );

const target = new URL(process.env.TEST_POSTGRES_URL);
const user = decodeURIComponent(target.username) || os.userInfo().username;
const endpoint = `${target.hostname}:${target.port || 5432}`;
// Only this run's schema is ever dropped.
const namespace = `blossm_cli_${crypto.randomUUID().replaceAll("-", "")}`;
const applicationName = `blossm-cli-${crypto.randomUUID().slice(0, 8)}`;
const tables = ["blockchain", "counts", "events", "publications", "snapshots"];

// Preloaded into the service: records every resolved module and every
// outbound socket destination.
const recorder = (loaded, sockets) => `
import { registerHooks } from "node:module";
import { appendFileSync } from "node:fs";
import net from "node:net";
registerHooks({
  resolve(specifier, context, next) {
    const result = next(specifier, context);
    appendFileSync(${JSON.stringify(loaded)}, result.url + "\\n");
    return result;
  },
});
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const destination =
    first !== null && typeof first == "object"
      ? (first.path ?? (first.host ?? "localhost") + ":" + first.port)
      : typeof first == "string" && !/^\\d+$/.test(first)
        ? first
        : (typeof args[1] == "string" ? args[1] : "localhost") + ":" + first;
  appendFileSync(${JSON.stringify(sockets)}, destination + "\\n");
  return connect.apply(this, args);
};
`;

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const lines = (file) =>
  fs.existsSync(file)
    ? [...new Set(fs.readFileSync(file, "utf8").trim().split("\n"))]
    : [];

describe("Generated PostgreSQL event-store service", function () {
  this.timeout(60000);
  let root;
  let database;
  let child;
  let exited;
  let output = "";
  let url;
  let environment;
  let loaded;
  let sockets;
  let gcloudCalls;

  const request = (route, options = {}) =>
    fetch(`${url}${route}`, {
      signal: AbortSignal.timeout(15000),
      ...options,
      ...(options.body && {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(options.body),
      }),
    });
  const event = (eventRoot, payload) => ({
    event: {
      headers: {
        root: eventRoot,
        idempotency: crypto.randomUUID(),
        topic: `some-topic.${procedure.domain}.${procedure.service}`,
        created: new Date().toISOString(),
        action: "start",
        domain: procedure.domain,
        service: procedure.service,
        network: environment.NETWORK,
        version: 0,
      },
      payload,
    },
  });
  const append = (...eventData) => request("/", { body: { eventData } });
  const count = async (table, eventRoot) =>
    Number(
      (
        await database.query(
          `SELECT count(*) FROM "${namespace}"."${table}"${
            eventRoot ? " WHERE root = $1" : ""
          }`,
          eventRoot ? [eventRoot] : [],
        )
      ).rows[0].count,
    );

  before(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "blossm-pg-service-"));
    database = connect({
      connectionString: process.env.TEST_POSTGRES_URL,
      max: 1,
    });

    // The real deploy command assembles the service; its only `gcloud` is the
    // fixture's recording double.
    const { result, capture, read, calls } = deploy(root, profile());
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(calls, [
      "beta builds submit . --config=build.yaml --project=blossm-network-development",
    ]);

    // Link exactly the declared runtime dependencies to their workspace
    // sources, so an undeclared import cannot resolve.
    for (const name of Object.keys(
      JSON.parse(read("package.json")).dependencies,
    )) {
      const link = path.join(capture, "node_modules", name);
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(
        fs.realpathSync(path.join(cliDir, "../../node_modules", name)),
        link,
        "dir",
      );
    }

    loaded = path.join(root, "loaded");
    sockets = path.join(root, "sockets");
    gcloudCalls = path.join(root, "service-gcloud-calls");
    const bin = path.join(root, "service-bin");
    fs.mkdirSync(bin);
    fs.writeFileSync(
      path.join(bin, "gcloud"),
      `#!/bin/sh\necho "$@" >> "${gcloudCalls}"\n`,
      { mode: 0o755 },
    );
    const preload = path.join(root, "record.mjs");
    fs.writeFileSync(preload, recorder(loaded, sockets));

    const port = await freePort();
    url = `http://127.0.0.1:${port}`;
    // The generated Compose environment, pointed at the supplied database.
    // PG_MAX and every non-connection value stay exactly as generated.
    const generated = yaml.parse(read("docker-compose.yaml")).services.main
      .environment;
    assert.equal(generated.NODE_ENV, "local");
    assert.equal(generated.PG_MAX, "2");
    environment = {
      ...Object.fromEntries(
        Object.entries(generated)
          .filter(([, value]) => value != null)
          .map(([key, value]) => [key, `${value}`]),
      ),
      PORT: `${port}`,
      PG_HOST: target.hostname,
      PG_DATABASE: decodeURIComponent(target.pathname.slice(1)) || user,
      PG_USER: user,
      // The entrypoint requires a value; a trust-authenticated server ignores it.
      PG_PASSWORD: decodeURIComponent(target.password) || "unused",
      PG_NAMESPACE: namespace,
      // The entrypoint passes no port; the driver reads its standard variable.
      PGPORT: `${target.port || 5432}`,
      PGAPPNAME: applicationName,
      PATH: bin,
    };

    child = spawn(
      process.execPath,
      ["--import", pathToFileURL(preload).href, "index.js"],
      { cwd: capture, env: environment, stdio: ["ignore", "pipe", "pipe"] },
    );
    exited = new Promise((resolve) => child.once("exit", resolve));
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (chunk) => (output += chunk));

    const deadline = Date.now() + 30000;
    for (;;) {
      if (child.exitCode != null || child.signalCode != null)
        throw new Error(`The service exited during startup.\n${output}`);
      if (Date.now() > deadline)
        throw new Error(`The service did not start in time.\n${output}`);
      const ready = await fetch(`${url}/_check-in`, {
        signal: AbortSignal.timeout(1000),
      }).then(
        (response) => response.ok,
        () => false,
      );
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  after(async () => {
    try {
      if (child && child.exitCode == null && child.signalCode == null) {
        child.kill("SIGTERM");
        const kill = setTimeout(() => child.kill("SIGKILL"), 5000);
        await exited;
        clearTimeout(kill);
      }
    } finally {
      try {
        if (database) {
          await database.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
          await database.end();
        }
      } finally {
        if (root) fs.rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it("starts from the generated environment and prepares its own namespace", async () => {
    const { rows } = await database.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name",
      [namespace],
    );
    assert.deepEqual(
      rows.map((row) => row.table_name),
      tables,
    );
    // The entrypoint resolved the workspace adapter and the real driver.
    const modules = lines(loaded);
    for (const expected of [
      "packages/procedures/event_stores/postgres/server/index.js",
      "node_modules/pg/lib/index.js",
    ])
      assert(
        modules.some((module) => module.endsWith(expected)),
        expected,
      );
  });

  it("appends, normalizes, reads and counts over HTTP", async () => {
    const eventRoot = crypto.randomUUID();
    assert.equal((await request(`/${eventRoot}`)).status, 404);
    assert.deepEqual(await (await request(`/count/${eventRoot}`)).json(), {
      count: 0,
    });

    assert.equal((await append(event(eventRoot, { device: "a" }))).status, 204);
    const first = await (await request(`/${eventRoot}`)).json();
    assert.equal(first.headers.root, eventRoot);
    assert.equal(first.headers.lastEventNumber, 0);
    assert.deepEqual(first.state, { device: "a" });

    // The schema declared in blossm.yaml casts and strips before storage.
    assert.equal(
      (await append(event(eventRoot, { device: 7, undeclared: true }))).status,
      204,
    );
    const second = await (await request(`/${eventRoot}`)).json();
    assert.equal(second.headers.lastEventNumber, 1);
    assert.deepEqual(second.state, { device: "7" });
    assert.deepEqual(await (await request(`/count/${eventRoot}`)).json(), {
      count: 2,
    });
    assert.equal(await count("events", eventRoot), 2);
  });

  it("rejects an invalid payload with a client error and stores nothing", async () => {
    const eventRoot = crypto.randomUUID();
    const response = await append(
      event(eventRoot, { device: "a" }),
      event(eventRoot, { device: { nested: true } }),
    );
    assert.equal(response.status, 400);
    assert.equal(await count("events", eventRoot), 0);
    assert.equal(await count("counts", eventRoot), 0);
  });

  it("creates chained blocks signed by the local key", async () => {
    assert.equal(
      (await append(event(crypto.randomUUID(), { device: "a" }))).status,
      204,
    );
    const create = async () => {
      const response = await request("/create-block", { method: "POST" });
      assert.equal(response.status, 200);
      return response.json();
    };
    const previous = await create();
    const block = await create();
    assert.equal(block.headers.pHash, previous.hash);
    assert.equal(block.headers.number, previous.headers.number + 1);
    for (const { hash, headers, signature } of [previous, block])
      assert(
        crypto
          .createVerify("SHA256")
          .update(hash)
          .verify(
            Buffer.from(headers.key, "base64").toString("utf8"),
            signature,
            "base64",
          ),
      );
  });

  it("serves concurrent appends within the generated pool size", async () => {
    const roots = Array.from({ length: 12 }, () => crypto.randomUUID());
    const responses = await Promise.all(
      roots.map((eventRoot) => append(event(eventRoot, { device: "a" }))),
    );
    assert.deepEqual(
      responses.map((response) => response.status),
      roots.map(() => 204),
    );
    for (const eventRoot of roots)
      assert.equal(await count("events", eventRoot), 1);
    // Idle clients stay in the pool, so this is the peak the burst reached.
    const { rows } = await database.query(
      "SELECT count(*) FROM pg_stat_activity WHERE application_name = $1",
      [applicationName],
    );
    const connections = Number(rows[0].count);
    assert(connections >= 1 && connections <= 2, `${connections} connections`);
  });

  it("keeps the local bypass: no outbox, no cloud client, no cloud call", async () => {
    assert.equal(
      (await append(event(crypto.randomUUID(), { device: "a" }))).status,
      204,
    );
    // Local mode stores no pending publication.
    assert.equal(await count("publications"), 0);

    // The shared logger statically imports its Cloud Logging transport in
    // every mode and constructs it only in deployed environments. No other
    // cloud client may load.
    const modules = lines(loaded);
    assert.deepEqual(
      modules.filter(
        (module) =>
          /\/packages\/vendors\/gcp\/(?!log_transports\/)/.test(module) ||
          /\/node_modules\/@google-cloud\/(pubsub|kms|tasks|scheduler|storage|secret-manager)\//.test(
            module,
          ),
      ),
      [],
    );
    assert(modules.some((module) => module.endsWith("/local.js")));
    assert(!modules.some((module) => module.endsWith("/cloud.js")));

    // Every socket the service opened went to the database.
    const destinations = lines(sockets);
    assert(destinations.length > 0);
    assert.deepEqual(
      destinations.filter((destination) => destination != endpoint),
      [],
    );
    assert(!fs.existsSync(gcloudCalls), "the service must not run gcloud");
    assert.equal(child.exitCode, null, output);
  });
});
