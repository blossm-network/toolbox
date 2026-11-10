import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import createSession from "../src/projection/deploy/src/session.js";
import path from "node:path";
import { load } from "./load.js";

const lease = {
  playId: "play",
  owner: "owner",
  generation: 1,
  limits: {
    maxOperations: 1,
    maxBytes: 65536,
    leaseMilliseconds: 30000,
    maxPlayMilliseconds: 1000,
  },
};

describe("Projection session client", () => {
  it("stops a stuck transform at the advertised deadline without committing", async () => {
    const actions = [];
    const execute = createSession({
      request: async ({ action }) => {
        actions.push(action);
        return {
          body: {
            ...lease,
            limits: { ...lease.limits, maxPlayMilliseconds: 5 },
          },
        };
      },
      pushFn: async () => {},
    });
    await assert.rejects(
      execute({ playId: "play", run: () => new Promise(() => {}) }),
      /deadline/,
    );
    assert.deepEqual(actions, ["begin", "release"]);
  });

  it("adds stable invocation IDs before the CLI enqueues a play or replay", async () => {
    const rootConfig = {
      vendors: {
        cloud: {
          gcp: {
            projects: { development: "project" },
            computeUrlIds: { development: "compute" },
          },
        },
      },
    };
    for (const data of [
      undefined,
      { root: "root" },
      { root: "root", playId: "explicit" },
    ]) {
      let task;
      const execute = await load("utils/execute_cli_template/index.js", {
        normalize: async () => ({
          env: "development",
          region: "us-central1",
          ...(data && { data: JSON.stringify(data) }),
        }),
        rootDir: { config: () => rootConfig },
        fs: { readFileSync: () => "" },
        yaml: { parse: () => ({ procedure: "projection", name: "cards" }) },
        path,
        process: { cwd: () => "/tmp" },
        console: { log: () => {} },
        roboSay: () => "",
        gcpQueue: {
          enqueue: () => async (value) => {
            task = value;
          },
        },
        uuid: () => "generated",
      });
      await execute({ domain: "projection" })([], () => ({
        operationName: "cards",
        operationHash: "hash",
      }));
      assert.deepEqual(
        task.data,
        data
          ? { ...data, playId: data.playId || "generated" }
          : { replayId: "generated" },
      );
    }
  });

  it("enforces destination-provided limits before submitting a batch", async () => {
    const actions = [];
    const execute = createSession({
      request: async ({ action }) => {
        actions.push(action);
        return { body: lease };
      },
      pushFn: async () => {},
    });
    await assert.rejects(
      execute({
        playId: "play",
        run: async (session) => {
          session.add({ type: "delete", id: "one" });
          session.add({ type: "delete", id: "two" });
        },
      }),
      /exceeds/,
    );
    assert.deepEqual(actions, ["begin", "release"]);
  });

  it("does not submit mutations after an uncertain renewal", async () => {
    const actions = [];
    const execute = createSession({
      request: async ({ action }) => {
        actions.push(action);
        if (action === "renew") throw new Error("Renewal lost");
        return {
          body: { ...lease, limits: { ...lease.limits, leaseMilliseconds: 3 } },
        };
      },
      pushFn: async () => {},
    });
    await assert.rejects(
      execute({ playId: "play", run: async () => delay(10) }),
      /Renewal lost/,
    );
    assert.ok(actions.includes("renew"));
    assert.ok(!actions.includes("commit"));
    assert.equal(actions.at(-1), "release");
  });

  it("acknowledges a committed play when notification delivery fails", async () => {
    const execute = createSession({
      request: async ({ action }) => {
        if (action === "begin") return { body: lease };
        if (action === "commit")
          return {
            body: {
              generation: 1,
              results: [
                { type: "put", result: { view: { headers: { id: "row" } } } },
              ],
            },
          };
        if (action === "notification")
          return { body: { view: { headers: { id: "row" } } } };
        return { body: {} };
      },
      pushFn: async () => {
        throw new Error("push unavailable");
      },
    });
    await execute({ playId: "play", run: async () => {} });
  });

  it("acknowledges committed work even when lease release fails", async () => {
    const actions = [];
    const execute = createSession({
      request: async ({ action }) => {
        actions.push(action);
        if (action === "begin") return { body: lease };
        if (action === "release") throw new Error("release unavailable");
        return {
          body: { complete: true, generation: lease.generation, results: [] },
        };
      },
      pushFn: async () => {},
    });
    await execute({
      playId: "stable",
      run: async (session) => session.add({ type: "delete", id: "one" }),
    });
    assert.deepEqual(actions, ["begin", "commit", "release"]);
  });

  it("still propagates a real commit failure", async () => {
    const execute = createSession({
      request: async ({ action }) => {
        if (action === "begin") return { body: lease };
        if (action === "commit") throw new Error("transaction failed");
        return { body: {} };
      },
      pushFn: async () => {},
    });
    await assert.rejects(
      execute({ playId: "play", run: async () => {} }),
      /transaction failed/,
    );
  });

  it("reloads a notification's current body and groups before sending", async () => {
    const current = {
      view: { headers: { id: "row", groups: ["current"] }, body: { count: 2 } },
    };
    let pushed;
    const execute = createSession({
      request: async ({ action }) => {
        if (action === "begin") return { body: lease };
        if (action === "commit")
          return {
            body: {
              generation: 1,
              results: [
                {
                  type: "put",
                  result: {
                    view: { headers: { id: "row" }, body: { count: 1 } },
                  },
                },
              ],
            },
          };
        if (action === "notification") return { body: current };
        return { body: {} };
      },
      pushFn: async (value) => {
        pushed = value;
      },
    });
    await execute({ playId: "play", run: async () => {} });
    assert.equal(pushed, current);
  });
});

describe("Generated projection session wiring", () => {
  it("buffers query-selected operations in handler order without an external ID stream", async () => {
    const projection = await load("blossm/src/projection/deploy/src/index.js", {
      projection: (options) => options,
      projectionSession: () => () => {},
      config: { name: "cards" },
      process: { env: {} },
      handlers: {
        animals: {
          bird: async () => ({
            ops: [
              { query: { count: 1 }, update: { $inc: { count: 1 } } },
              { id: "id", update: { count: 4 } },
            ],
          }),
        },
      },
      gcpSecret: { get: () => {} },
      composeUpdate: (update) => update,
      viewStore: () => {
        throw new Error("No external ID stream");
      },
    });
    const operations = [];
    await projection.mainFn({
      aggregate: {
        headers: {
          service: "animals",
          domain: "bird",
          root: "root",
        },
      },
      session: { add: (operation) => operations.push(operation) },
    });
    assert.deepStrictEqual(
      operations.map(({ type }) => type),
      ["put-query", "put"],
    );
    assert.deepStrictEqual(operations[0].query, { count: 1 });
  });
});

describe("Generated fenced projection conditions", () => {
  for (const operation of [
    { id: "card", query: { count: 1 }, update: { count: 2 } },
    {
      id: "card",
      query: { "parent.id": "A", "parent.child.id": "X" },
      del: true,
    },
    {
      id: "card",
      query: { status: "active" },
      update: { $set: { "items.$[item].name": "new" } },
      arrayFilters: [{ "item.id": "first" }],
    },
  ])
    it(`buffers original ID conditions for ${JSON.stringify(operation)}`, async () => {
      const projection = await load(
        "blossm/src/projection/deploy/src/index.js",
        {
          projection: (options) => options,
          projectionSession: () => () => {},
          config: { name: "cards" },
          process: { env: {} },
          handlers: { core: { source: async () => operation } },
          gcpSecret: {},
          composeUpdate: (update) => update,
        },
      );
      const operations = [];
      await projection.mainFn({
        aggregate: {
          headers: { service: "core", domain: "source", root: "source" },
        },
        session: { add: (operation) => operations.push(operation) },
      });
      const buffered = operations[0];
      assert.deepEqual(
        operation.del ? buffered.query : buffered.body.query,
        operation.query,
      );
      if (operation.arrayFilters) {
        assert.deepEqual(buffered.body.arrayFilters, [{ "item.id": "first" }]);
        assert.deepEqual(operation.arrayFilters, [{ "item.id": "first" }]);
      }
    });
});

describe("Generated projection infrastructure mode", () => {
  it("uses sessions remotely and retains the local direct path", async () => {
    for (const mode of ["production", "local"]) {
      let sessions = 0;
      const projection = await load(
        "blossm/src/projection/deploy/src/index.js",
        {
          projection: (options) => options,
          projectionSession: () => {
            sessions++;
            return () => {};
          },
          config: { name: "cards" },
          process: { env: { NODE_ENV: mode } },
          handlers: {},
          gcpSecret: { get: () => {} },
        },
      );
      assert.equal(sessions, mode === "local" ? 0 : 1);
      assert.equal(
        typeof projection.sessionFn,
        mode === "local" ? "undefined" : "function",
      );
    }
  });
});

describe("Local ordered projection operations", () => {
  it("lets a dependent direct mutation observe its predecessor without session infrastructure", async () => {
    let count = 0;
    const projection = await load("blossm/src/projection/deploy/src/index.js", {
      projection: (options) => options,
      config: { name: "cards" },
      process: { env: { NODE_ENV: "local" } },
      handlers: {
        core: {
          source: async () => ({
            ops: [
              { id: "row", update: { count: 1 } },
              { id: "row", query: { count: 1 }, update: { count: 2 } },
            ],
          }),
        },
      },
      gcpSecret: {},
      gcpToken() {},
      gcpQueue: { enqueue() {} },
      composeUpdate: (update) => update,
      viewStore: () => ({
        set: () => ({
          update: async ({ query, update }) => {
            if (query && query.count !== count) return { statusCode: 204 };
            if (update.count === 1)
              await new Promise((resolve) => setImmediate(resolve));
            count = update.count;
            return { body: {} };
          },
        }),
      }),
    });
    assert.equal(projection.sessionFn, undefined);
    await projection.mainFn({
      aggregate: {
        headers: { service: "core", domain: "source", root: "source" },
      },
      push: false,
    });
    assert.equal(count, 2);
  });
});
