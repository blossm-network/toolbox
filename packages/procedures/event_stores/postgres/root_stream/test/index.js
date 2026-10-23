import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store root stream", () => {
  afterEach(restore);

  it("uses inclusive lower and exclusive upper bounds, preserving zero", async () => {
    const stream = fake.resolves("result");
    replace(deps, "db", { stream });
    const fn = fake();
    expect(
      await operation({ countsStore: "counts" })({
        updatedOnOrAfter: 0,
        updatedBefore: 10,
        reverse: true,
        limit: 0,
        parallel: 2,
        fn,
        transaction: "transaction",
      })
    ).to.equal("result");
    expect(stream.firstCall.args[0]).to.deep.equal({
      store: "counts",
      query: { updated: { $gte: 0, $lt: 10 } },
      sort: { updated: 1, root: 1 },
      limit: 0,
      parallel: 2,
      fn,
      transaction: "transaction",
    });
    await operation({ countsStore: "counts" })({ fn });
    expect(stream.secondCall.args[0]).to.deep.equal({
      store: "counts",
      query: {},
      sort: { updated: -1, root: 1 },
      parallel: 1,
      fn,
      transaction: undefined,
    });
  });
});
