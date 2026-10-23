import assert from "node:assert/strict";
import { fake, replace, restore, useFakeTimers } from "sinon";
import commandPost from "../index.js";
import eventStore from "../../../../rpc/event_store/index.js";
import rpcDeps from "../../../../rpc/generic/deps.js";
import eventPost from "../../../event_stores/generic/post/index.js";

// Compose the repository's command, RPC, POST and transaction implementations.
// Only HTTP, persistence and rollback are modeled; no live Mongo guarantee.
describe("Callbacks after committed event outcomes", () => {
  let environment, clock;
  beforeEach(() => {
    environment = { ...process.env };
    Object.assign(process.env, {
      DOMAIN: "challenge",
      SERVICE: "core",
      NETWORK: "test.network",
      NODE_ENV: "local",
      HOST: "test",
      OPERATION_HASH: "answer",
      PROCEDURE: "command",
      NAME: "answer",
    });
    clock = useFakeTimers({
      now: Date.parse("2026-10-23T12:00:00Z"),
      toFake: ["Date"],
    });
    replace(rpcDeps, "operationToken", fake.resolves({}));
    replace(rpcDeps, "operationUrl", fake.returns("https://test.invalid"));
  });
  afterEach(() => {
    restore();
    clock.restore();
    for (const key of Object.keys(process.env))
      if (!(key in environment)) delete process.env[key];
    Object.assign(process.env, environment);
  });

  const fixture = (delayDuplicateLookup) => {
    let count = 1,
      checks = 0,
      committed,
      tail = Promise.resolve();
    const firstCommit = new Promise((resolve) => {
      committed = resolve;
    });
    const written = [];
    const outcomes = [];
    const upgrade = fake.resolves({ response: { upgraded: true } });
    const store = eventPost({
      idempotencyConflictCheckFn: async (key) => {
        if (delayDuplicateLookup && ++checks > 1) await firstCommit;
        return written.some((event) => event.headers.idempotency === key);
      },
      reserveRootCountsFn: async ({ root, amount }) => ({
        root,
        value: (count += amount),
      }),
      saveEventsFn: async ({ events }) => {
        written.push(...events);
        committed();
      },
      createTransactionFn: (fn) => {
        const next = tail.then(async () => {
          const before = count,
            length = written.length;
          try {
            return await fn();
          } catch (error) {
            count = before;
            written.splice(length);
            throw error;
          }
        });
        tail = next.catch(() => {});
        return next;
      },
      publishFn: async () => {},
    });
    replace(
      rpcDeps,
      "post",
      fake(async (url, { body }) => {
        let response;
        await store(
          { body },
          {
            send: (body) => {
              response = { statusCode: 200, body: JSON.stringify(body) };
            },
            sendStatus: (statusCode) => {
              response = { statusCode };
            },
          }
        );
        return response;
      })
    );
    const handler = commandPost({
      mainFn: async () => ({
        events: [
          {
            root: "challenge",
            action: "answer",
            payload: { answered: "same-time" },
            correctNumber: 1,
          },
        ],
        thenFn: async ({ outcomes: results }) => {
          outcomes.push(results[0].status);
          if (results[0].status !== "committed") return;
          return upgrade();
        },
      }),
      aggregateFn: () => fake(),
      commandFn: () => fake(),
      queryAggregatesFn: () => fake(),
      readFactFn: () => fake(),
      streamFactFn: () => fake(),
      countFn: () => fake(),
      addFn: ({ domain, service, eventData, tx, returnOutcomes }) =>
        eventStore({ domain, service }).add({ eventData, tx, returnOutcomes }),
    });
    const run = () =>
      handler(
        {
          body: {
            payload: {},
            headers: {
              idempotency: "same-key",
              issued: "2026-10-23T12:00:00Z",
            },
          },
        },
        {
          set() {
            return this;
          },
          status() {
            return this;
          },
          send() {},
          sendStatus() {},
        }
      );
    return { run, upgrade, outcomes, written };
  };

  it("keeps both duplicate requests successful but upgrades only the newly committed one", async () => {
    const f = fixture(true);
    await Promise.all([f.run(), f.run()]);
    assert.deepEqual(f.outcomes.sort(), ["committed", "duplicate"]);
    assert.equal(f.upgrade.callCount, 1);
    assert.equal(f.written.length, 1);
    assert.equal("answerId" in f.written[0].payload, false);
  });

  it("propagates the number conflict when both lookups miss the competing write", async () => {
    const f = fixture(false);
    const results = await Promise.allSettled([f.run(), f.run()]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1
    );
    assert.equal(
      results.find((result) => result.status === "rejected").reason.statusCode,
      412
    );
    assert.deepEqual(f.outcomes, ["committed"]);
    assert.equal(f.upgrade.callCount, 1);
    assert.equal(f.written.length, 1);
  });
});
