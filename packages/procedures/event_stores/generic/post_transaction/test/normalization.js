import assert from "node:assert/strict";
import { fake } from "sinon";
import hash from "@blossm/hash";
import post from "../index.js";

const eventData = () =>
  ["a", "b"].map((root) => ({
    event: {
      headers: {
        root,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK,
      },
    },
  }));

describe("Transaction normalization", () => {
  it("normalizes once before reserving roots and hashes exactly that representation", async () => {
    const tx = { id: "normalized", path: [] };
    let finish;
    const normalizeTransactionFn = fake(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const reserveRootCountsFn = fake(async ({ root }) => ({ root, value: 1 }));
    const saveEventsFn = fake.resolves();
    const pending = post({
      tx: { id: 123 },
      eventData: eventData(),
      normalizeTransactionFn,
      reserveRootCountsFn,
      saveEventsFn,
    })();
    assert.equal(normalizeTransactionFn.callCount, 1);
    assert.deepEqual(normalizeTransactionFn.firstCall.args, [
      { id: 123, path: [] },
    ]);
    assert.equal(reserveRootCountsFn.callCount, 0);
    finish(tx);
    await pending;
    assert.equal(normalizeTransactionFn.callCount, 1);
    assert.equal(reserveRootCountsFn.callCount, 2);
    for (const event of saveEventsFn.firstCall.args[0].events) {
      assert.deepEqual(event.tx, tx);
      assert.equal(event.headers.tHash, hash(tx).create());
    }
  });

  it("does not reserve counts or persist events when metadata is invalid", async () => {
    const failure = new Error("invalid metadata");
    const reserveRootCountsFn = fake();
    const saveEventsFn = fake();
    await assert.rejects(
      post({
        eventData: eventData(),
        normalizeTransactionFn: fake.rejects(failure),
        reserveRootCountsFn,
        saveEventsFn,
      })(),
      (error) => error === failure
    );
    assert.equal(reserveRootCountsFn.callCount, 0);
    assert.equal(saveEventsFn.callCount, 0);
  });
});

describe("Payload normalization", () => {
  const event = (payload) => ({
    event: {
      headers: {
        root: "a",
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK,
      },
      ...(payload !== undefined && { payload }),
    },
  });

  it("awaits the adapter's payload before reserving roots, then hashes and persists exactly it", async () => {
    let finish;
    const normalizePayloadFn = fake(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const reserveRootCountsFn = fake(async ({ root }) => ({ root, value: 1 }));
    const saveEventsFn = fake.resolves();
    const pending = post({
      eventData: [event({ amount: "2", dropped: true })],
      normalizeTransactionFn: (tx) => tx,
      normalizePayloadFn,
      reserveRootCountsFn,
      saveEventsFn,
    })();
    await new Promise(setImmediate);
    assert.deepEqual(normalizePayloadFn.args, [[{ amount: "2", dropped: true }]]);
    assert.equal(reserveRootCountsFn.callCount, 0);
    finish({ amount: 2 });
    await pending;
    const [saved] = saveEventsFn.firstCall.args[0].events;
    assert.deepEqual(saved.payload, { amount: 2 });
    assert.equal(saved.headers.pHash, hash({ amount: 2 }).create());
    assert.notEqual(
      saved.headers.pHash,
      hash({ amount: "2", dropped: true }).create()
    );
    assert.equal(saved.hash, hash(saved.headers).create());
  });

  it("normalizes each event's own payload, defaulting an absent one to {}", async () => {
    const saveEventsFn = fake.resolves();
    await post({
      eventData: [event({ n: 1 }), event(), event({ n: 3 })],
      normalizeTransactionFn: (tx) => tx,
      normalizePayloadFn: async (payload) => ({ ...payload, cast: true }),
      reserveRootCountsFn: async ({ root }) => ({ root, value: 3 }),
      saveEventsFn,
    })();
    assert.deepEqual(
      saveEventsFn.firstCall.args[0].events.map(({ headers, payload }) => [
        headers.number,
        payload,
      ]),
      [
        [0, { n: 1, cast: true }],
        [1, { cast: true }],
        [2, { n: 3, cast: true }],
      ]
    );
  });

  it("does not reserve counts or persist events when a payload is invalid", async () => {
    const failure = new Error("invalid payload");
    const reserveRootCountsFn = fake();
    const saveEventsFn = fake();
    await assert.rejects(
      post({
        eventData: [event({})],
        normalizeTransactionFn: (tx) => tx,
        normalizePayloadFn: fake.rejects(failure),
        reserveRootCountsFn,
        saveEventsFn,
      })(),
      (error) => error === failure
    );
    assert.equal(reserveRootCountsFn.callCount, 0);
    assert.equal(saveEventsFn.callCount, 0);
  });

  for (const [kind, reject] of [
    ["rejects", () => Promise.reject(new Error("invalid payload"))],
    [
      "throws synchronously",
      () => {
        throw new Error("invalid payload");
      },
    ],
  ])
    it(`does not reserve counts or persist any event of a mixed batch when one normalization ${kind}`, async () => {
      const reserveRootCountsFn = fake();
      const saveEventsFn = fake();
      await assert.rejects(
        post({
          eventData: [
            event({ n: 1 }),
            event({ invalid: true }),
            event({ n: 3 }),
          ],
          normalizeTransactionFn: (tx) => tx,
          normalizePayloadFn: (payload) =>
            payload.invalid ? reject() : Promise.resolve(payload),
          reserveRootCountsFn,
          saveEventsFn,
        })(),
        { message: "invalid payload" }
      );
      assert.equal(reserveRootCountsFn.callCount, 0);
      assert.equal(saveEventsFn.callCount, 0);
    });

  it("gives each attempt its own copy, so a mutating normalizer cannot change the submission or a retry", async () => {
    const submitted = { amount: "2", nested: { visits: 0 } };
    const original = structuredClone(submitted);
    const saveEventsFn = fake.resolves();
    // The transaction driver reruns this same function after a known abort.
    const attempt = post({
      eventData: [event(submitted)],
      normalizeTransactionFn: (tx) => tx,
      normalizePayloadFn: async (payload) => {
        payload.amount = Number(payload.amount) + 1;
        payload.nested.visits++;
        return payload;
      },
      reserveRootCountsFn: async ({ root }) => ({ root, value: 1 }),
      saveEventsFn,
    });
    await attempt();
    await attempt();
    assert.deepEqual(submitted, original);
    const [first, retried] = saveEventsFn.args.map(([{ events }]) => events[0]);
    assert.deepEqual(first.payload, { amount: 3, nested: { visits: 1 } });
    assert.deepEqual(retried.payload, first.payload);
    assert.equal(retried.headers.pHash, first.headers.pHash);
    assert.equal(retried.headers.pHash, hash(retried.payload).create());
  });

  it("keeps the submitted payload when the adapter supplies no normalizer", async () => {
    const payload = { amount: "2" };
    const saveEventsFn = fake.resolves();
    await post({
      eventData: [event(payload)],
      normalizeTransactionFn: (tx) => tx,
      reserveRootCountsFn: async ({ root }) => ({ root, value: 1 }),
      saveEventsFn,
    })();
    const [saved] = saveEventsFn.firstCall.args[0].events;
    assert.equal(saved.payload, payload);
    assert.equal(saved.headers.pHash, hash(payload).create());
  });
});
