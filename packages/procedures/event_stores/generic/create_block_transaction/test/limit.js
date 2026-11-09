import { expect } from "chai";
import { replace, restore } from "sinon";
import create from "../index.js";
import deps from "../deps.js";

describe("Block bounds", () => {
  afterEach(restore);

  it("bounds changed roots and requests continuation when more remain", async () => {
    const snapshots = [];
    replace(deps, "aggregate", () => async () => ({
      headers: { lastEventNumber: 0 },
      state: { amount: 1 },
      context: {},
      groups: [],
      txIds: ["tx"],
      events: [{ hash: "event", payload: {}, tx: { id: "tx" } }],
    }));
    const result = await create({
      latestBlockFn: async () => ({
        hash: "previous",
        headers: {
          number: 0,
          end: "2026-01-01T00:00:00.000Z",
        },
      }),
      rootStreamFn: async ({ fn }) => {
        for (let i = 0; i < 120; i++)
          await fn({ root: `root-${i}`, updated: "2026-01-02T00:00:00.000Z" });
      },
      saveSnapshotFn: async ({ snapshot }) => {
        snapshots.push(snapshot);
        return snapshot;
      },
      saveBlockFn: async ({ block }) => block,
      signFn: async () => "signature",
      blockPublisherPublicKeyFn: async () => "key",
      isPublic: true,
      blockLimit: 100,
    })();
    expect(snapshots.length).to.be.greaterThan(0).and.at.most(100);
    expect(result.full).to.equal(true);
  });
});
