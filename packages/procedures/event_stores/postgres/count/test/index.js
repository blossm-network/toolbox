import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store count", () => {
  afterEach(restore);

  it("returns zero for a new root and the stored count otherwise", async () => {
    const find = fake.resolves([]);
    replace(deps, "db", { find });
    expect(
      await operation({ countsStore: "counts" })({ root: "root" })
    ).to.equal(0);
    expect(find.firstCall.args[0]).to.deep.equal({
      store: "counts",
      query: { root: "root" },
      transaction: undefined,
    });
    restore();
    replace(deps, "db", { find: fake.resolves([{ value: 12 }]) });
    expect(
      await operation({ countsStore: "counts" })({ root: "root" })
    ).to.equal(12);
  });
});
