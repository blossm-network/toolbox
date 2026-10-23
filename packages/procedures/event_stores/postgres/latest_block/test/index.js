import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

describe("Postgres event store latest block", () => {
  afterEach(restore);

  it("returns the highest numbered block or null", async () => {
    const find = fake.resolves(["block"]);
    replace(deps, "db", { find });
    expect(
      await operation({ blockchainStore: "blocks" })({
        transaction: "transaction",
      })
    ).to.equal("block");
    expect(find.firstCall.args[0]).to.deep.equal({
      store: "blocks",
      query: {},
      sort: { "headers.number": -1 },
      limit: 1,
      transaction: "transaction",
    });
    restore();
    replace(deps, "db", { find: fake.resolves([]) });
    expect(await operation({ blockchainStore: "blocks" })()).to.equal(null);
  });
});
