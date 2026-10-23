import assert from "node:assert/strict";
import post from "../index.js";

const root = "some-root";
const event = (key, eventRoot = root) => ({
  headers: {
    root: eventRoot,
    idempotency: key,
    action: "answer",
    topic: "some-topic",
    created: "2026-10-23T12:00:00.000Z",
    version: 0,
    domain: "some-domain",
    service: "some-service",
    network: "some-network",
  },
  payload: { answered: "same-time" },
});

// Exercise the real POST and transaction handlers. Only persistence and
// transaction rollback are modeled; no Mongo rollback behavior is claimed.
const fixture = (initialCount = 0) => {
  const counts = new Map([[root, initialCount]]);
  const saved = [];
  const handler = post({
    idempotencyConflictCheckFn: async (key) =>
      saved.some((e) => e.headers.idempotency === key),
    reserveRootCountsFn: async ({ root, amount }) => {
      const value = (counts.get(root) || 0) + amount;
      counts.set(root, value);
      return { root, value };
    },
    saveEventsFn: async ({ events }) => {
      saved.push(...events);
    },
    createTransactionFn: async (fn) => {
      const before = new Map(counts);
      const length = saved.length;
      try {
        return await fn();
      } catch (error) {
        counts.clear();
        for (const [key, value] of before) counts.set(key, value);
        saved.splice(length);
        throw error;
      }
    },
    publishFn: async () => {},
  });
  const run = async (eventData, returnOutcomes = true) => {
    let result;
    await handler(
      { body: { eventData, returnOutcomes } },
      {
        send: (body) => {
          result = body;
        },
        sendStatus: (code) => {
          result = code;
        },
      }
    );
    return result;
  };
  return { run, counts, saved };
};

describe("Committed event outcomes", () => {
  let environment;
  beforeEach(() => {
    environment = { ...process.env };
    Object.assign(process.env, {
      DOMAIN: "some-domain",
      SERVICE: "some-service",
      NETWORK: "some-network",
      NODE_ENV: "local",
    });
  });
  afterEach(() => {
    for (const key of Object.keys(process.env))
      if (!(key in environment)) delete process.env[key];
    Object.assign(process.env, environment);
  });

  it("distinguishes a numbered commit from its successful duplicate retry", async () => {
    const f = fixture();
    const entry = { event: event("same"), number: 0 };
    assert.deepEqual(await f.run([entry]), { outcomes: ["committed"] });
    assert.deepEqual(await f.run([entry]), { outcomes: ["duplicate"] });
    assert.equal(f.saved.length, 1);
  });

  it("reports mixed durable and within-batch duplicates in input order", async () => {
    const f = fixture();
    await f.run([{ event: event("old") }]);
    const result = await f.run([
      { event: event("fresh", "another-root") },
      { event: event("old") },
      { event: event("second") },
      { event: event("fresh", "another-root") },
    ]);
    assert.deepEqual(result.outcomes, [
      "committed",
      "duplicate",
      "committed",
      "duplicate",
    ]);
    assert.equal(f.saved.length, 3);
  });

  it("keeps legacy callers on 204 and represents empty input with no outcomes", async () => {
    const f = fixture();
    assert.equal(await f.run([{ event: event("legacy") }], false), 204);
    assert.deepEqual(await f.run([]), { outcomes: [] });
  });

  it("propagates a stale new write without reporting a commitment", async () => {
    const f = fixture(1);
    await assert.rejects(
      f.run([{ event: event("new"), number: 0 }]),
      (e) => e.statusCode === 412
    );
    assert.equal(f.saved.length, 0);
    assert.equal(f.counts.get(root), 1);
  });
});
