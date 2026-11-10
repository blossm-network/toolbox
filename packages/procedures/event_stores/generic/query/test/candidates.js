import assert from "node:assert/strict";
import query from "../index.js";

const snapshot = (root, state) => ({
  headers: { root, lastEventNumber: 0 },
  state,
  context: {},
  groups: [],
  txIds: [],
});
const create = ({
  snapshots = {},
  matching = [],
  dirty = [],
  events = {},
  failSnapshots,
  failStream,
  failReplay,
} = {}) => {
  const replayed = [];
  const calls = [];
  const run = query({
    findSnapshotsFn: async (options) => {
      calls.push(options);
      if (failSnapshots) throw failSnapshots;
      return matching.map((root) => ({ headers: { root } }));
    },
    rootStreamFn: async ({ unsnapshottedOnly, fn }) => {
      if (failStream) throw failStream;
      const roots = unsnapshottedOnly
        ? dirty
        : Object.keys({ ...snapshots, ...events });
      for (const root of roots) await fn({ root });
    },
    findOneSnapshotFn: async ({ query }) => snapshots[query["headers.root"]],
    eventStreamFn: async ({ query, fn }) => {
      const root = query["headers.root"];
      replayed.push(root);
      if (failReplay) throw failReplay;
      for (const event of events[root] || [])
        fn({
          headers: { action: "set", number: 1 },
          payload: event,
          context: {},
          tx: {},
        });
    },
    handlers: { set: (state, payload) => ({ ...state, ...payload }) },
  });
  return { run, replayed, calls };
};

describe("Snapshot-assisted query candidates", () => {
  it("replays matching snapshots and dirty roots once, skipping unrelated fresh roots", async () => {
    const { run, replayed, calls } = create({
      snapshots: {
        match: snapshot("match", { a: 1 }),
        unrelated: snapshot("unrelated", { a: 2 }),
      },
      matching: ["match", "match"],
      dirty: ["match", "new"],
      events: { new: [{ a: 1 }] },
    });
    assert.deepEqual(
      (await run([{ key: "a", value: 1 }])).map((a) => a.headers.root),
      ["match", "new"],
    );
    assert.deepEqual(replayed, ["match", "new"]);
    assert.deepEqual(calls, [
      {
        query: { $and: [{ "state.a": 1 }] },
        select: { "headers.root": 1 },
        limit: null,
      },
    ]);
  });
  it("rechecks stale snapshot matches and dirty state after replay", async () => {
    const { run } = create({
      snapshots: {
        stale: snapshot("stale", { a: 1 }),
        dirty: snapshot("dirty", { a: 2 }),
      },
      matching: ["stale"],
      dirty: ["stale", "dirty"],
      events: { stale: [{ a: 2 }], dirty: [{ a: 1 }] },
    });
    assert.deepEqual(
      (await run([{ key: "a", value: 1 }])).map((a) => a.headers.root),
      ["dirty"],
    );
  });
  it("does not truncate matching fresh snapshots at100", async () => {
    const matching = Array.from({ length: 120 }, (_, i) => `root-${i}`);
    const snapshots = Object.fromEntries(
      matching.map((root) => [root, snapshot(root, { a: 1 })]),
    );
    const { run, replayed } = create({ matching, snapshots });
    assert.equal((await run([{ key: "a", value: 1 }])).length, 120);
    assert.equal(replayed.length, 120);
  });
  it("uses the ordinary root stream for empty queries without querying snapshots", async () => {
    const { run, calls, replayed } = create({
      snapshots: { r: snapshot("r", { a: 1 }) },
    });
    assert.equal((await run([])).length, 1);
    assert.deepEqual(calls, []);
    assert.deepEqual(replayed, ["r"]);
  });
  for (const seam of ["failSnapshots", "failStream", "failReplay"])
    it(`propagates ${seam} failures`, async () => {
      const failure = new Error(seam);
      const { run } = create({ [seam]: failure, matching: ["r"] });
      await assert.rejects(
        run([{ key: "a", value: 1 }]),
        (error) => error === failure,
      );
    });
});
