import { expect } from "chai";
import { replace, restore } from "sinon";
import create from "../index.js";
import deps from "../deps.js";

describe("Durable block progress", () => {
  let environment;
  beforeEach(() => {
    environment = {
      DOMAIN: process.env.DOMAIN,
      SERVICE: process.env.SERVICE,
      NETWORK: process.env.NETWORK,
    };
    Object.assign(process.env, { DOMAIN: "d", SERVICE: "s", NETWORK: "n" });
  });
  afterEach(() => {
    restore();
    for (const [key, value] of Object.entries(environment)) {
      if (value == undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("includes a late committed root after an empty block and advances only its snapshot frontier", async () => {
    let now = "2026-01-03T00:00:00.000Z";
    replace(deps, "dateString", () => now);
    let block = {
      hash: "previous",
      headers: { number: 0, end: "2026-01-02T00:00:00.000Z" },
    };
    let snapshot;
    const events = [];
    const counts = [];
    const transaction = {};
    const readContexts = [];
    const build = create({
      latestBlockFn: async (options) => {
        readContexts.push(options?.transaction);
        return block;
      },
      rootStreamFn: async ({
        fn,
        updatedOnOrAfter,
        updatedBefore,
        transaction: session,
      }) => {
        readContexts.push(session);
        for (const root of counts) {
          if (updatedOnOrAfter && root.updated < updatedOnOrAfter) continue;
          if (updatedBefore && root.updated >= updatedBefore) continue;
          await fn(root);
        }
      },
      findOneSnapshotFn: async ({ transaction: session }) => {
        readContexts.push(session);
        return snapshot;
      },
      eventStreamFn: async ({ query, fn, transaction: session }) => {
        readContexts.push(session);
        for (const event of events) {
          if (
            query["headers.number"] &&
            event.headers.number <= query["headers.number"].$gt
          )
            continue;
          await fn(event);
        }
      },
      handlers: {
        add: (state, { amount }) => ({ amount: (state.amount || 0) + amount }),
      },
      saveSnapshotFn: async ({ snapshot: next }) => {
        snapshot = next;
        return next;
      },
      saveBlockFn: async ({ block: next }) => {
        block = next;
        return next;
      },
      signFn: async () => "signature",
      blockPublisherPublicKeyFn: async () => "key",
      isPublic: true,
      blockLimit: 100,
    });
    expect((await build(transaction)).block.headers.eCount).to.equal(0);
    // The event's application timestamp predates the block that committed first.
    counts.push({ root: "late", updated: "2026-01-01T00:00:00.000Z" });
    events.push({
      hash: "event",
      headers: {
        root: "late",
        number: 1,
        action: "add",
        created: counts[0].updated,
      },
      payload: { amount: 7 },
      context: {},
      tx: { id: "tx" },
    });
    now = "2026-01-04T00:00:00.000Z";
    const included = await build(transaction);
    expect(included.block.headers.eCount).to.equal(1);
    expect(included.block.headers.end).to.equal(now);
    expect(snapshot.headers.lastEventNumber).to.equal(1);
    expect(snapshot.state).to.deep.equal({ amount: 7 });
    now = "2026-01-05T00:00:00.000Z";
    expect((await build(transaction)).block.headers.eCount).to.equal(0);
    expect(readContexts.every((session) => session === transaction)).to.equal(
      true
    );
  });
});
