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
  const run = async (eventData) => {
    let status;
    await handler(
      { body: { eventData } },
      {
        sendStatus: (code) => {
          status = code;
        },
      }
    );
    return status;
  };
  return { run, counts, saved };
};

describe("Numbered append preconditions", () => {
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

  for (const number of [0, 1]) {
    it(`rejects an already-applied conditional event at number ${number}`, async () => {
      const f = fixture(number);
      const entry = { event: event("same-key"), number };
      assert.equal(await f.run([entry]), 204);
      await assert.rejects(f.run([entry]), (e) => e.statusCode === 412);
      assert.equal(f.saved.length, 1);
      assert.equal(f.counts.get(root), number + 1);
    });
  }

  it("preserves successful no-op retries for unnumbered writes", async () => {
    const f = fixture();
    const entry = { event: event("same-key") };
    assert.equal(await f.run([entry]), 204);
    assert.equal(await f.run([entry]), 204);
    assert.equal(f.saved.length, 1);
    assert.equal(f.counts.get(root), 1);
  });

  it("preserves the order of valid mixed batches", async () => {
    const f = fixture();
    assert.equal(
      await f.run([
        { event: event("first") },
        { event: event("second"), number: 1 },
      ]),
      204
    );
    assert.deepEqual(
      f.saved.map((e) => e.headers.idempotency),
      ["first", "second"]
    );
    assert.deepEqual(
      f.saved.map((e) => e.headers.number),
      [0, 1]
    );
  });

  it("enforces a conditional duplicate inside the same batch", async () => {
    const f = fixture();
    await assert.rejects(
      f.run([{ event: event("same") }, { event: event("same"), number: 0 }]),
      (e) => e.statusCode === 412
    );
    assert.equal(f.saved.length, 0);
    assert.equal(f.counts.get(root), 0);
  });

  it("still skips an unnumbered duplicate following a numbered event", async () => {
    const f = fixture();
    assert.equal(
      await f.run([
        { event: event("same"), number: 0 },
        { event: event("same") },
      ]),
      204
    );
    assert.equal(f.saved.length, 1);
    assert.equal(f.counts.get(root), 1);
  });

  it("rejects the whole same-store batch when a stale numbered duplicate accompanies a fresh root", async () => {
    const f = fixture();
    await f.run([{ event: event("already-written"), number: 0 }]);
    await assert.rejects(
      f.run([
        { event: event("fresh", "another-root") },
        { event: event("already-written"), number: 0 },
      ]),
      (e) => e.statusCode === 412
    );
    assert.equal(f.saved.length, 1);
    assert.equal(f.counts.has("another-root"), false);
  });
});
