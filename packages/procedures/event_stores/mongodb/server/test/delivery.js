import assert from "node:assert/strict";
import { fake } from "sinon";
import deliverPending from "../src/deliver_pending.js";

describe("Pending delivery loop", () => {
  it("uses the configured identity and removes an entry only after delivery", async () => {
    const entry = { id: "entry", data: {} };
    let acknowledge;
    const delivery = new Promise((resolve) => {
      acknowledge = resolve;
    });
    const db = {
      find: fake.resolves([entry]),
      remove: fake.resolves(),
      write: fake.resolves(),
    };
    const deliverFn = fake.returns(delivery);
    const pending = deliverPending({
      store: "pending",
      key: "id",
      db,
      deliverFn,
    })();
    await new Promise(setImmediate);
    assert.equal(db.remove.callCount, 0);
    assert.equal(deliverFn.firstCall.args[0], entry);
    acknowledge();
    await pending;
    assert.deepEqual(db.find.firstCall.args[0], {
      store: "pending",
      query: {},
      sort: { attempts: 1, created: 1, id: 1 },
      limit: 100,
      options: { lean: true },
    });
    assert.deepEqual(db.remove.firstCall.args[0], {
      store: "pending",
      query: { id: entry.id },
    });
  });
});
