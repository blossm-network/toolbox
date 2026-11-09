import { expect } from "chai";
import { fake } from "sinon";
import deliverPending from "../index.js";

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
    expect(db.remove.callCount).to.equal(0);
    expect(deliverFn.firstCall.args[0]).to.equal(entry);
    acknowledge();
    await pending;
    expect(db.find.firstCall.args[0]).to.deep.equal({
      store: "pending",
      query: {},
      sort: { attempts: 1, created: 1, id: 1 },
      limit: 100,
      options: { lean: true },
    });
    expect(db.remove.firstCall.args[0]).to.deep.equal({
      store: "pending",
      query: { id: entry.id },
    });
  });
  it("processes one custom-sized batch and reselects remaining work on later calls", async () => {
    const entries = Array.from({ length: 5 }, (_, id) => ({ id }));
    const db = {
      find: fake(async ({ limit }) => entries.slice(0, limit)),
      remove: fake(async ({ query }) => {
        entries.splice(
          entries.findIndex(({ id }) => id === query.id),
          1
        );
      }),
      write: fake.resolves(),
    };
    const deliverFn = fake.resolves();
    const drain = deliverPending({
      store: "pending",
      key: "id",
      deliverFn,
      db,
      batchSize: 2,
    });
    await drain();
    expect(deliverFn.callCount).to.equal(2);
    expect(entries.length).to.equal(3);
    await drain();
    expect(deliverFn.callCount).to.equal(4);
    expect(entries.length).to.equal(1);
    await drain();
    expect(deliverFn.callCount).to.equal(5);
    expect(entries.length).to.equal(0);
  });

  it("rejects batch sizes that cannot bound a positive number of entries", () => {
    for (const batchSize of [
      0,
      -1,
      1.5,
      Infinity,
      NaN,
      Number.MAX_SAFE_INTEGER + 1,
      "2",
    ])
      expect(() => deliverPending({ batchSize })).to.throw(RangeError);
  });
});
