import assert from "node:assert/strict";
import createProtocol from "../index.js";

const setup = async () => {
  const calls = [];
  const control = {
    updateOne: async (...args) => {
      calls.push(args);
      return { matchedCount: 1 };
    },
    findOneAndUpdate: async () => ({ generation: 3 }),
  };
  const receipts = { findOne: async () => null };
  const store = {
    init: async () => {},
    db: {
      asPromise: async () => {},
      db: {
        collection: (name) =>
          name === "projection_control" ? control : receipts,
        createCollection: async () => {},
      },
    },
  };
  return {
    protocol: await createProtocol({ store }),
    calls,
    control,
    receipts,
  };
};

describe("Mongo projection session", () => {
  it("requires a stable play ID and advertises bounded lease/batch limits", async () => {
    const { protocol } = await setup();
    await assert.rejects(protocol.begin({}), { statusCode: 400 });
    const lease = await protocol.begin({ playId: "stable" });
    assert.equal(lease.playId, "stable");
    assert.equal(lease.generation, 3);
    assert.equal(lease.limits.maxOperations, 100);
    assert.equal(lease.limits.maxBytes, 65536);
  });

  it("acknowledges a retained receipt without reacquiring a lease", async () => {
    const { protocol, control, receipts } = await setup();
    receipts.findOne = async () => ({ _id: "stable" });
    control.findOneAndUpdate = async () => {
      throw new Error("must not lease");
    };
    assert.deepEqual(await protocol.begin({ playId: "stable" }), {
      complete: true,
      results: [],
    });
  });

  it("rejects expired renewals and oversized batches before opening a transaction", async () => {
    const { protocol, control } = await setup();
    control.updateOne = async () => ({ matchedCount: 0 });
    await assert.rejects(
      protocol.renew({ playId: "stable", owner: "owner", generation: 1 }),
      { statusCode: 409 }
    );
    await assert.rejects(
      protocol.commit({ playId: "stable", operations: Array(101).fill({}) }),
      { statusCode: 400 }
    );
  });
});
