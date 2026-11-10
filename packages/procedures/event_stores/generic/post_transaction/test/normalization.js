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
