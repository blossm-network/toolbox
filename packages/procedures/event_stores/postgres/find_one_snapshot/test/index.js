import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store find one snapshot", () => {
  afterEach(restore);

  it("returns the selected snapshot, or null when none exists", async () => {
    const find = fake.resolves(["snapshot"]);
    replace(deps, "db", { find });
    const options = {
      query: { "headers.root": "root" },
      sort: { "headers.number": -1 },
      select: { state: 1 },
      transaction: "transaction",
    };
    expect(await operation({ snapshotStore: "snapshots" })(options)).to.equal(
      "snapshot"
    );
    expect(find.firstCall.args[0]).to.deep.equal({
      store: "snapshots",
      ...options,
      limit: 1,
    });
    restore();
    replace(deps, "db", { find: fake.resolves([]) });
    expect(
      await operation({ snapshotStore: "snapshots" })({ query: {} })
    ).to.equal(null);
  });
});
