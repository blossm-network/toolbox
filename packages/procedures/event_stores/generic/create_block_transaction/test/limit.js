import { expect } from "chai";
import { replace, restore } from "sinon";
import create from "../index.js";
import deps from "../deps.js";
import createBlock from "../../create_block/index.js";

const updated = "2026-01-02T00:00:00.000Z";
const previous = {
  hash: "previous",
  headers: { number: 0, end: "2026-01-01T00:00:00.000Z" },
};
const aggregate = () => ({
  headers: { lastEventNumber: 0 },
  state: { amount: 1 },
  context: {},
  groups: [],
  txIds: ["tx"],
  events: [{ hash: "event", payload: {}, tx: { id: "tx" } }],
});

// Honor the callback concurrency requested by the actual block builder.
const stream =
  (roots) =>
  async ({ fn, parallel }) => {
    let next = 0;
    await Promise.all(
      Array.from({ length: parallel }, async () => {
        while (next < roots) {
          const index = next++;
          await fn({ root: `root-${index}`, updated });
        }
      }),
    );
  };
const build = async (roots, transaction) => {
  const snapshots = [];
  replace(deps, "aggregate", () => async () => aggregate());
  const result = await create({
    latestBlockFn: async () => previous,
    rootStreamFn: stream(roots),
    saveSnapshotFn: async ({ snapshot }) => {
      snapshots.push(snapshot);
      return snapshot;
    },
    saveBlockFn: async ({ block }) => block,
    signFn: async () => "signature",
    blockPublisherPublicKeyFn: async () => "key",
    isPublic: true,
    blockLimit: 100,
  })(transaction);
  return { ...result, snapshots };
};

describe("Block bounds", () => {
  afterEach(restore);

  for (const roots of [0, 89, 90])
    it(`does not request continuation for ${roots} roots in a sequential transaction`, async () => {
      const result = await build(roots, {});
      expect(result.snapshots).to.have.length(roots);
      expect(result.full).to.equal(false);
    });

  it("uses the existing 90-root sequential allowance and flags the remaining root", async () => {
    const result = await build(91, {});
    expect(result.snapshots).to.have.length(90);
    expect(result.full).to.equal(true);
  });

  it("bounds concurrent local callbacks within the existing 100-root limit", async () => {
    const result = await build(120);
    expect(result.snapshots.length).to.be.at.least(90).and.at.most(100);
    expect(result.full).to.equal(true);
  });

  it("drains tied-timestamp roots through the real handler and aggregate without duplicate snapshots", async () => {
    replace(deps, "dateString", () => "2026-01-03T00:00:00.000Z");
    const roots = Array.from(
      { length: 120 },
      (_, i) => `root-${String(i).padStart(3, "0")}`,
    );
    const snapshots = new Map();
    const savedRoots = [];
    const blocks = [];
    let latest = previous;
    let continuations = 0;
    let run;
    run = createBlock({
      latestBlockFn: async () => latest,
      rootStreamFn: async ({
        fn,
        parallel,
        updatedOnOrAfter,
        updatedBefore,
      }) => {
        expect(parallel).to.equal(1);
        if (updated >= updatedOnOrAfter && updated < updatedBefore)
          for (const root of roots) await fn({ root, updated });
      },
      findOneSnapshotFn: async ({ query }) =>
        snapshots.get(query["headers.root"]),
      eventStreamFn: async ({ query, fn }) => {
        if (query["headers.number"]?.$gt >= 0) return;
        const root = query["headers.root"];
        await fn({
          hash: `event-${root}`,
          headers: { root, action: "set", number: 0, created: updated },
          payload: { amount: 1 },
          context: {},
          tx: { id: `tx-${root}` },
        });
      },
      handlers: { set: (_, payload) => payload },
      saveSnapshotFn: async ({ snapshot }) => {
        savedRoots.push(snapshot.headers.root);
        snapshots.set(snapshot.headers.root, snapshot);
        return snapshot;
      },
      saveBlockFn: async ({ block }) => {
        latest = block;
        blocks.push(block);
        return block;
      },
      createTransactionFn: (fn) => fn({}),
      createBlockFn: async () => {
        continuations++;
        await run({}, { send: () => {} });
      },
      publishPendingFn: async () => {},
      signFn: async () => "signature",
      blockPublisherPublicKeyFn: async () => "key",
      isPublic: true,
    });
    await run({}, { send: () => {} });
    expect(blocks.map(({ headers }) => headers.sCount)).to.deep.equal([90, 30]);
    expect(continuations).to.equal(1);
    expect(savedRoots).to.have.length(120);
    expect(new Set(savedRoots).size).to.equal(120);
    expect([...snapshots.keys()].sort()).to.deep.equal(roots);
  });
});
