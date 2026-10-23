import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store save snapshot", () => {
  afterEach(restore);

  it("forwards the document and transaction and returns the saved result", async () => {
    const save = fake.resolves("saved");
    replace(deps, "db", { save });
    const document = { hash: "hash" };
    expect(
      await operation({ snapshotStore: "store" })({
        snapshot: document,
        transaction: "transaction",
      })
    ).to.equal("saved");
    expect(save.firstCall.args[0]).to.deep.equal({
      store: "store",
      data: document,
      transaction: "transaction",
    });
  });
});
