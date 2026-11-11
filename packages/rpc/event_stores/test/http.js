import assert from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import eventStores from "../index.js";
import streamDeps from "../../stream/deps.js";
import eventServer from "../../../procedures/event_stores/generic/server/index.js";
import serverDeps from "../../../procedures/server/deps.js";
import hash from "../../../lib/operation_hash/index.js";
import shortName from "../../../lib/operation_short_name/index.js";

const region = "fixture-region";

describe("Native multiple-event-store composition", () => {
  let environment;
  let servers;
  let seen;
  let rootCalls;
  let eventCalls;

  beforeEach(async () => {
    const settings = {
      HOST: "fixture-internal",
      NODE_ENV: "production",
      DOMAIN: "fixture",
      SERVICE: "core",
      NETWORK: "local",
      GCP_COMPUTE_URL_ID: "fixture-id",
    };
    environment = Object.fromEntries(
      Object.keys(settings).map((key) => [key, process.env[key]]),
    );
    Object.assign(process.env, settings);
    servers = [];
    seen = [];
    rootCalls = [];
    eventCalls = [];
    const addresses = new Map();
    const express = serverDeps.express;
    let listening;
    let currentDomain;
    replace(serverDeps, "express", () => {
      const app = express();
      const domain = currentDomain;
      app.use((req, _, next) => {
        seen.push({
          domain,
          path: new URL(req.url, "http://fixture.invalid").pathname,
          query: req.query,
          authorization: req.headers.authorization,
        });
        next();
      });
      const listen = app.listen.bind(app);
      app.listen = () => {
        let server;
        listening = new Promise((resolve) => {
          server = listen(0, "127.0.0.1", () => resolve(server));
        });
        servers.push(server);
        return server;
      };
      return app;
    });
    replace(streamDeps, "operationUrl", ({ host, path }) => {
      assert.ok(addresses.has(host), `Unknown generated address: ${host}`);
      return `${addresses.get(host)}${path}`;
    });
    for (const [domain, entries] of [
      [
        "alpha",
        [
          ["a", { rank: 2, text: "🦋 }" }],
          ["extra", { rank: 5 }],
        ],
      ],
      [
        "beta",
        [
          ["b", { rank: 1 }],
          ["z", { rank: 3 }],
        ],
      ],
    ]) {
      currentDomain = domain;
      const states = new Map(entries);
      await eventServer({
        normalizeTransactionFn: async (value) => value,
        publishPendingFn: async () => {},
        rootStreamFn: async ({ fn, ...options }) => {
          rootCalls.push({ domain, options });
          for (const root of states.keys()) await fn({ root });
        },
        findOneSnapshotFn: async () => undefined,
        eventStreamFn: async ({ query, fn }) => {
          eventCalls.push({ domain, query });
          const root = query["headers.root"];
          if (states.has(root))
            await fn({
              headers: {
                root,
                number: 0,
                action: "set",
                created: "2026-01-01T00:00:00.000Z",
              },
              payload: states.get(root),
              context: {},
              tx: { id: `${domain}-${root}` },
            });
        },
        handlers: { set: (_, payload) => payload },
      });
      const server = await listening;
      const parts = [domain, "core", "event-store"];
      addresses.set(
        `${region}-${shortName(parts)}-${hash(...parts)}-fixture-id.${region}.run.app`,
        `http://127.0.0.1:${server.address().port}`,
      );
    }
  });
  afterEach(async () => {
    for (const server of servers) server.closeAllConnections();
    await Promise.all(
      servers.map((server) => new Promise((resolve) => server.close(resolve))),
    );
    restore();
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("sorts one requested root per source through real RPC, HTTP and aggregate handlers", async () => {
    const first = Object.freeze({ root: "a", timestamp: "2026-11-10" });
    const second = Object.freeze({ root: "b" });
    const token = fake.resolves({ token: "fixture-identity", type: "Bearer" });
    const output = [];
    let active = 0;
    await eventStores({
      region,
      storeQueries: [
        { domain: "alpha", query: first },
        { domain: "beta", service: "core", query: second },
      ],
    })
      .set({
        context: { principal: { root: "caller" } },
        claims: { role: "reader" },
        token: { internalFn: token },
      })
      .stream(
        async (record) => {
          active++;
          assert.equal(active, 1);
          await new Promise((resolve) => setImmediate(resolve));
          output.push(record);
          active--;
        },
        (a, b) => a.state.rank - b.state.rank,
      );
    assert.deepEqual(
      output.map(({ state }) => state.rank),
      [1, 2],
    );
    assert.equal(output[1].state.text, "🦋 }");
    assert.equal(token.callCount, 2);
    assert.equal(rootCalls.length, 0);
    assert.equal(
      eventCalls.find(({ domain }) => domain === "alpha").query[
        "headers.created"
      ].$lte,
      first.timestamp,
    );
    for (const request of seen) {
      assert.equal(request.path, "/stream-aggregates");
      assert.equal(request.authorization, "Bearer fixture-identity");
      assert.equal(request.query.context.principal.root, "caller");
      assert.equal(request.query.claims.role, "reader");
    }
    assert.deepEqual(first, { root: "a", timestamp: "2026-11-10" });
    assert.deepEqual(second, { root: "b" });
  });

  it("consumes full scans without a comparator and preserves query defaults", async () => {
    const output = [];
    await eventStores({
      region,
      storeQueries: [
        {
          domain: "alpha",
          query: { parallel: 1, updatedOnOrAfter: "2020-01-01" },
        },
        { domain: "beta" },
      ],
    }).stream((record) => output.push(record.headers.root));
    assert.deepEqual(output.sort(), ["a", "b", "extra", "z"]);
    assert.deepEqual(
      rootCalls.sort((a, b) => a.domain.localeCompare(b.domain)),
      [
        {
          domain: "alpha",
          options: { parallel: "1", updatedOnOrAfter: "2020-01-01" },
        },
        { domain: "beta", options: {} },
      ],
    );
    assert.equal(
      seen.every(({ authorization }) => authorization === undefined),
      true,
    );
  });
});
