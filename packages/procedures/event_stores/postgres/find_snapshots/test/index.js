import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store find snapshots", () => {
  afterEach(restore);

  it("keeps snapshot queries bounded and forwards sorting and transaction", async () => {
    const find = fake.resolves(["snapshot"]);
    replace(deps, "db", { find });
    const options = {
      query: { "headers.root": "root" },
      sort: { "headers.created": -1 },
      transaction: "transaction",
    };
    expect(
      await operation({ snapshotStore: "snapshots" })(options),
    ).to.deep.equal(["snapshot"]);
    expect(find.firstCall.args[0]).to.deep.equal({
      store: "snapshots",
      ...options,
      limit: 100,
    });
    await operation({ snapshotStore: "snapshots" })({ query: {} });
    expect(find.secondCall.args[0]).not.to.have.property("sort");
    expect(find.secondCall.args[0]).not.to.have.property("select");
  });

  it("forwards the generic query's root projection and unbounded limit", async () => {
    const find = fake.resolves([]);
    replace(deps, "db", { find });
    const options = {
      query: { $and: [{ "state.label": "pink" }] },
      select: { "headers.root": 1 },
      limit: null,
    };
    await operation({ snapshotStore: "snapshots" })(options);
    expect(find.firstCall.args[0]).to.deep.equal({
      store: "snapshots",
      ...options,
      transaction: undefined,
    });
  });
});
